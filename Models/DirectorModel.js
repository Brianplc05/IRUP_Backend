import config from "../Configuration/config.js";
import sql from "mssql";

const getSuperAuditDT = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT
                IRD.IRNo,
                IRD.lostRec,
                IRS.SubjectName AS SubjectName,
                IRI.PrimaryDept,
                D.description AS Department_Description,
                US.FullName AS TransferFullName,
                US1.FullName AS MainFullName
            FROM
                IRUP..IRDetails IRD
            LEFT JOIN
                [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
            LEFT JOIN
                IRUP..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN 
                IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
            LEFT JOIN 
                IRUP..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
            LEFT JOIN 
                IRUP..Users US ON IRT.EmpTransfer = US.EmployeeCode
            WHERE 
                IRD.QAStatus = '1'
                AND IRS.SubjectCode != 'others' 
            ORDER BY
                CASE WHEN IRD.lostRec IS NULL THEN 0 ELSE 1 END,
                IRD.DateTimeCreated DESC`;
                
        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}



const getAllDirector = async (EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const sqlQuery = `
            SELECT
                IRD.IRNo,
                IRD.lostRec,
                IRS.SubjectName AS SubjectName,
                IRI.PrimaryDept,
                D.description AS Department_Description,
                US.FullName AS TransferFullName,
                US1.FullName AS MainFullName
            FROM
                IRUP..IRDetails IRD
            LEFT JOIN
                [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
            LEFT JOIN
                IRUP..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN 
                IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
            LEFT JOIN 
                IRUP..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
            LEFT JOIN 
                IRUP..Users US ON IRT.EmpTransfer = US.EmployeeCode
            LEFT JOIN 
                IRUP..DirectorUser DU ON IRI.PrimaryDept = DU.DeptCode
            WHERE 
                IRD.QAStatus = '1'
                AND IRS.SubjectCode != 'others' 
                AND DU.EmployeeCode = @EmployeeCode
            ORDER BY
                CASE WHEN IRD.lostRec IS NULL THEN 0 ELSE 1 END,
                IRD.DateTimeCreated DESC;
        `;

        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        const result = await request.query(sqlQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query in getAllDirector:', error);
        throw error;
    }
};

const getAllHead = async (EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const sqlQuery = `
            SELECT
                IRD.IRNo,
                IRD.lostRec,
                IRS.SubjectName AS SubjectName,
                IRI.PrimaryDept,
                D.description AS Department_Description,
                US.FullName AS TransferFullName,
                US1.FullName AS MainFullName
            FROM
                IRUP..IRDetails IRD
            LEFT JOIN
                [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
            LEFT JOIN
                IRUP..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN 
                IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
            LEFT JOIN 
                IRUP..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
            LEFT JOIN 
                IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
            LEFT JOIN 
                IRUP..Users US ON IRT.EmpTransfer = US.EmployeeCode
            LEFT JOIN 
                IRUP..IREmail IRE ON IRI.PrimaryDept = IRE.DeptCode
            WHERE 
                IRD.QAStatus = '1'
                AND IRS.SubjectCode != 'others' 
                AND IRE.EmployeeCode = @EmployeeCode
            ORDER BY
                CASE WHEN IRD.lostRec IS NULL THEN 0 ELSE 1 END,
                IRD.DateTimeCreated DESC;
        `;

        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        const result = await request.query(sqlQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query in getAllDirector:', error);
        throw error;
    }
};

const getIREPORT = async (IRNo) => {
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
                DeptDesc.DeptCodeInvDescriptions

            FROM
                IRUP..IRDetails IRD
            LEFT JOIN IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN (
                SELECT 
                    ID.IRNo,
                    D1.Dept_Desc AS PrimaryDept,
                    STRING_AGG(D2.Dept_Desc, ', ') AS DeptCodeInvDescriptions
                FROM 
                    IRUP..IRDeptInvolved ID
                LEFT JOIN IRUP..IREmail D1 ON ID.PrimaryDept = D1.DeptCode
                CROSS APPLY STRING_SPLIT(ID.DeptCodeInv, ',') AS SplitDeptCode
                LEFT JOIN IRUP..IREmail D2 ON SplitDeptCode.value = D2.DeptCode
                GROUP BY ID.IRNo, D1.Dept_Desc
            ) DeptDesc ON IRD.IRNo = DeptDesc.IRNo
            WHERE
                IRD.IRNo = @IRNo;`;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(select);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const DirectorLostRec = async (IRNo, lostRec, FinancialLiability, LostRecUpdatedBy) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('lostRec', sql.Int, lostRec);
        request.input('FinancialLiability', sql.NVarChar, FinancialLiability);
        request.input('LostRecUpdatedBy', sql.NVarChar, LostRecUpdatedBy);

        const insertDirectorLostRec = `
        UPDATE IRDetails
        SET lostRec = @lostRec,
        FinancialLiability = @FinancialLiability,
        LostRecUpdatedBy = @LostRecUpdatedBy,
        LostRecDateTimeCreated =  GETDATE()
        WHERE IRNo = @IRNo`;

        const result = await request.query(insertDirectorLostRec);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

export default{
    getSuperAuditDT,
    getAllDirector,
    getAllHead,
    DirectorLostRec,
    getIREPORT
}