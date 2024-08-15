import config from "../Configuration/config.js";
import sql from "mssql";

const allDeptCode = async (EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        request.input('EmployeeCode', sql.VarChar, EmployeeCode);
        const query = 'SELECT DeptCode FROM testdb..DirectorUser WHERE EmployeeCode = @EmployeeCode;';
        
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error executing SQL query in allDeptCode:', error);
        throw error;
    }
};

const getAllDirector = async () => {
    try {
    
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const sqlQuery = `
        SELECT
            IRD.IRNo,
            IRD.lostRec,
                CASE
                    WHEN IRS.SubjectName IS NULL THEN IRO.SpecifiedName
                    ELSE IRS.SubjectName
                END AS SubjectName,
            IRI.PrimaryDept,
            D.description AS Department_Description,
            US.FullName AS TransferFullName,
                CASE
                    WHEN US1.FullName IS NULL THEN 'BAYOG, VANGERINE DE MESA.'
                    ELSE US1.FullName
                END AS MainFullName
        FROM
            testdb..IRDetailss IRD
        LEFT JOIN
            [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
        LEFT JOIN
            testdb..IRDeptInvolved id ON IRD.IRNo = id.IRNo
        LEFT JOIN 
            testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
        LEFT JOIN 
            testdb..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
        LEFT JOIN 
            testdb..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
        LEFT JOIN 
            testdb..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
        LEFT JOIN 
            testdb..Users US ON IRT.EmpTransfer = US.EmployeeCode
        LEFT JOIN 
            testdb..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
        LEFT JOIN 
			testdb..IROtherSubjectName IRO ON IRD.IRNo = IRO.IRNo
        WHERE 
            IRD.QAStatus = '1'
        ORDER BY
            CASE WHEN IRD.lostRec IS NULL THEN 0 ELSE 1 END,
            IRD.DateTimeCreated DESC;`;
        
        const result = await request.query(sqlQuery);
        return result.recordset; 
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
                    CASE
                        WHEN IRS.SubjectName IS NULL THEN IRO.SpecifiedName
                        ELSE IRS.SubjectName
                    END AS SubjectName,
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
            LEFT JOIN testdb..IROtherSubjectName IRO ON IRD.IRNo = IRO.IRNo
            WHERE
                IRD.IRNo = @IRNo;`;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(select);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const DirectorLostRec = async (IRNo, lostRec, FinancialLiability) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('lostRec', sql.Int, lostRec);
        request.input('FinancialLiability', sql.NVarChar, FinancialLiability);

        const insertDirectorLostRec = `
        UPDATE IRDetailss
        SET lostRec = @lostRec,
        FinancialLiability = @FinancialLiability
        WHERE IRNo = @IRNo`;

        const result = await request.query(insertDirectorLostRec);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

export default{
    getAllDirector,
    DirectorLostRec,
    getIREPORT,
    allDeptCode
}