import config from "../Configuration/config.js";
import sql from "mssql";

const getAll = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT
            IRD.IRNo,
            US.FullName AS TransferFullName,
            US1.FullName AS MainFullName,
            IRD.DeptCode AS Department_Code,
            IRS.SubjectName,
            IRD.RCA,
            IRD.lostRec,
            IRD.FinancialLiability,
            D.description AS Department_Description,
            IRN.newHRNote,
            IRD.HRStatus
        FROM
            testdb..IRDetailss IRD
        LEFT JOIN [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
        LEFT JOIN testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
        LEFT JOIN testdb..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
        LEFT JOIN testdb..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
        LEFT JOIN testdb..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
        LEFT JOIN testdb..Users US ON IRT.EmpTransfer = US.EmployeeCode
        LEFT JOIN (
            SELECT
                newHRNote,
                IRNo
            FROM
                testdb..IRHRNote
        ) IRN ON IRD.IRNo = IRN.IRNo
        WHERE
            IRS.SubjectCode != 'others'
        ORDER BY
            IRD.HRStatus DESC,
            IRD.DateTimeCreated DESC;
        `;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const HRStatus = async (HRStatus, IRNo) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetailss
                    SET HRStatus = @HRStatus
                    WHERE IRNo = @IRNo`;
                
                request.input('HRStatus', sql.Bit, HRStatus);
                request.input('IRNo', sql.NVarChar, IRNo);

                const result = await request.query(updateQuery);
                return result

            } catch (error) {
                console.error('Error executing SQL query:', error);
                throw error;
            }
}

const getHRIREPORT = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const select = `
        SELECT 
            IRD.IRNo,
            IRS.SubjectName,
            IRD.SubjectDate,
            IRD.SubjectTime,
            IRD.SubjectLoc,
            IRD.SubjectNote,
            IRD.SubjectCause,
            IRD.SubjectResponse,
            IRD.DateTimeCreated,
            DeptDesc.PrimaryDept,
            DeptDesc.DeptCodeInvDescriptions,
            IRA.CombinedActionItems AS ActionItem,
            IHN.newHRNote

        FROM
            testdb..IRDetailss IRD
        LEFT JOIN testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
        LEFT JOIN (
            SELECT 
                ID.IRNo,
                D1.Dept_Desc AS PrimaryDept,
                STRING_AGG(D2.Dept_Desc, ', ') AS DeptCodeInvDescriptions
            FROM 
                testdb..IRDeptInvolved ID
            LEFT JOIN testdb..IREmail D1 ON ID.PrimaryDept = D1.DeptCode
            CROSS APPLY STRING_SPLIT(ID.DeptCodeInv, ',') AS SplitDeptCode
            LEFT JOIN testdb..IREmail D2 ON SplitDeptCode.value = D2.DeptCode
            GROUP BY ID.IRNo, D1.Dept_Desc
        ) DeptDesc ON IRD.IRNo = DeptDesc.IRNo
        LEFT JOIN (
            SELECT
                newHRNote,
                IRNo
            FROM
                testdb..IRHRNote
        ) IHN ON IRD.IRNo = IHN.IRNo
		LEFT JOIN (
                SELECT 
                    IRNo,
                    STRING_AGG(ActionItem, '. ') AS CombinedActionItems
                FROM
                    testdb..IRActionItems
                GROUP BY IRNo
            ) IRA ON IRD.IRNo = IRA.IRNo
        WHERE
            IRD.IRNo = @IRNo;
        `;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(select);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const HRAction = async (HRDicipAction, IRNo) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetailss
                    SET HRDicipAction = @HRDicipAction
                    WHERE IRNo = @IRNo`;
                
                request.input('HRDicipAction', sql.Bit, HRDicipAction);
                request.input('IRNo', sql.NVarChar, IRNo);

                const result = await request.query(updateQuery);
                return result

            } catch (error) {
                console.error('Error executing SQL query:', error);
                throw error;
            }
}

const HRNote = async (newHRNote, IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQuery = `
        INSERT INTO IRHRNote (IRNo, newHRNote, DateTimeCreated)
        VALUES (@IRNo, @newHRNote, GETDATE())
        `;

        request.input('newHRNote', sql.NVarChar, newHRNote);
        request.input('IRNo', sql.NVarChar, IRNo);

        const result = await request.query(insertQuery);
        return result;

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const HRNotes = async (newHRNote, IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQuery = `
        INSERT INTO IRHRNote (IRNo, newHRNote, DateTimeCreated)
        VALUES (@IRNo, @newHRNote, GETDATE())

        UPDATE IRDetailss
        SET DateTimeHRUpdated = GETDATE(),
        HRStatus = '0'
        WHERE IRNo = @IRNo;
        `;

        request.input('newHRNote', sql.NVarChar, newHRNote);
        request.input('IRNo', sql.NVarChar, IRNo);

        const result = await request.query(insertQuery);
        return result;

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const HRFinLiability = async (IRNo, FinancialLiability) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('FinancialLiability', sql.NVarChar, FinancialLiability);

        const updateQuery = `
            UPDATE IRDetailss
            SET FinancialLiability = @FinancialLiability
            WHERE IRNo = @IRNo;
        `;
        const result = await request.query(updateQuery);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};


export default{
    getAll,
    HRStatus,
    getHRIREPORT,
    HRAction,
    HRNote,
    HRNotes,
    HRFinLiability
}