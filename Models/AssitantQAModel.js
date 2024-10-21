import config from "../Configuration/config.js";
import sql from "mssql";

const getSuperAuditQAA = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `SELECT 
                i.IRNo, 
                d.description AS Department_Description,
                CASE 
                    WHEN uaq1.Division IS NOT NULL AND uaq1.DivisionCode IS NOT NULL 
                    THEN uaq1.Division 
                    ELSE uaq.Division 
                END AS Division,
                CASE 
                    WHEN uaq1.Division IS NOT NULL AND uaq1.DivisionCode IS NOT NULL 
                    THEN uaq1.DivisionCode 
                    ELSE uaq.DivisionCode 
                END AS DivisionCode,
                irs.SubjectCode
            FROM IRUP..IRDetails i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN IRUP..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN IRUP..IRDivision uaq ON i.DivisionCode = uaq.DivisionCode
            LEFT JOIN IRUP..IRDivision uaq1 ON i.TransferDivisionCode = uaq1.DivisionCode
            WHERE 
                irs.SubjectCode = 'others' 
            ORDER BY 
                i.DateTimeCreated DESC;`;
                
        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const getAllAssistantQA = async (EmployeeCode) => {
    try {
    
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const sqlQuery = `            
            SELECT 
                i.IRNo, 
                d.description AS Department_Description,
                CASE 
                    WHEN uaq1.Division IS NOT NULL AND uaq1.DivisionCode IS NOT NULL 
                    THEN uaq1.Division 
                    ELSE uaq.Division 
                END AS Division,
                CASE 
                    WHEN uaq1.Division IS NOT NULL AND uaq1.DivisionCode IS NOT NULL 
                    THEN uaq1.DivisionCode 
                    ELSE uaq.DivisionCode 
                END AS DivisionCode,
                irs.SubjectCode
            FROM IRUP..IRDetails i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN IRUP..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN IRUP..IRDivision uaq ON i.DivisionCode = uaq.DivisionCode
            LEFT JOIN IRUP..IRDivision uaq1 ON i.TransferDivisionCode = uaq1.DivisionCode
            WHERE 
                irs.SubjectCode = 'others' 
                AND (
                    (uaq1.Division IS NOT NULL AND uaq1.DivisionCode IS NOT NULL 
                        AND (uaq1.QA = @EmployeeCode OR uaq1.QAAssitant = @EmployeeCode)) 
                    OR 
                    (uaq1.Division IS NULL AND uaq1.DivisionCode IS NULL 
                        AND (uaq.QA = @EmployeeCode OR uaq.QAAssitant = @EmployeeCode))
                )
            ORDER BY 
                i.DateTimeCreated DESC;
            `;
        
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        const result = await request.query(sqlQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query in getAllAssistantQA:', error);
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
                IRD.SubjectBriefDes,
                IRD.SubjectDate,
                IRD.SubjectTime,
                IRD.SubjectLoc,
                IRD.SubjectNote,
                IRD.SubjectCause,
                IRD.SubjectResponse,
                IRD.DateTimeCreated

            FROM
                IRUP..IRDetails IRD
            LEFT JOIN IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            WHERE
                IRD.IRNo = @IRNo;`;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(select);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getDivisionName = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const selectQuery = `  
            SELECT DISTINCT
                DivisionCode,
                Division
            FROM IRUP..IRDivision
            ORDER BY DivisionCode ASC`;

        const result = await request.query(selectQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getSubjectName = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const selectQuery = `SELECT * 
            FROM IRUP..IRSubjectName 
            WHERE SubjectCode <> 'others';
            `;

        const result = await request.query(selectQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const UpdateDivisionCode = async (IRNo, TransferDivisionCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        console.log('CHECK DATA', IRNo, TransferDivisionCode)
        
        const updateQuery = `
            UPDATE IRDetails
            SET TransferDivisionCode = @TransferDivisionCode
            WHERE IRNo = @IRNo;
            
            SELECT TOP 1
                IRD.IRNo, 
                IRD.DivisionCode,
				IRD.TransferDivisionCode,
                IRD.SubjectBriefDes,
                E.FULLNAME AS QANameOwner,
                E.UERMEmail AS QAEmailOwner,
				E1.FULLNAME AS QAANameOwner,
                E1.UERMEmail AS QAAEmailOwner,
				ES.FULLNAME AS TransferQAName,
                ES.UERMEmail AS TransferQAEmail,
				ES1.FULLNAME AS TransferQAAName,
                ES1.UERMEmail AS TransferQAAEmail

            FROM 
                IRUP..IRDetails IRD 
            LEFT JOIN 
                IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode 
            LEFT JOIN 
                IRUP..IRDivision UAQ ON IRD.DivisionCode = UAQ.DivisionCode
			LEFT JOIN
                [UE database]..vw_Employees E ON UAQ.QA = E.CODE
            LEFT JOIN
                [UE database]..vw_Employees E1 ON UAQ.QAAssitant = E1.CODE
			LEFT JOIN 
                IRUP..IRDivision UAQ1 ON IRD.TransferDivisionCode = UAQ1.DivisionCode
			LEFT JOIN
                [UE database]..vw_Employees ES ON UAQ1.QA = ES.CODE
            LEFT JOIN
                [UE database]..vw_Employees ES1 ON UAQ1.QAAssitant = ES1.CODE
			WHERE
                IRD.IRNo = @IRNo
            ORDER BY 
                IRD.DateTimeCreated DESC;`;


        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('TransferDivisionCode', sql.NVarChar, TransferDivisionCode);

        return await request.query(updateQuery); // Removed the unnecessary assignment to 'result'
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const UpdateSubjectCode = async (IRNo, SubjectCode, EmUpdSubCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const updateQuery = `
            UPDATE IRUP..IRDetails
            SET 
                SubjectCode = @SubjectCode, 
                EmUpdSubCode = @EmUpdSubCode,
                EmDateUpdSubCode = GETDATE(),  -- Correctly using GETDATE() function
                DateTimeCreated = GETDATE()
            WHERE 
                IRNo = @IRNo;

            SELECT TOP 1
                IRD.IRNo, 
                IRS.SubjectCode,
                IRS.SubjectName,
                IRD.DivisionCode,
                E.FULLNAME AS TransferName,
                US1.FULLNAME AS QANAME,
                E.UERMEmail AS TransferEmail, 
                US1.UERMEmail AS QAEMAIL
            FROM 
                IRUP..IRDetails IRD 
            LEFT JOIN 
                IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode 
            LEFT JOIN 
                IRUP..IRDivision UAQ ON IRD.DivisionCode = UAQ.DivisionCode
            LEFT JOIN
                [UE database]..vw_Employees E ON IRD.EmUpdSubCode = E.CODE
            LEFT JOIN 
                IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
            WHERE
                IRD.IRNo = @IRNo
            ORDER BY 
                IRD.DateTimeCreated DESC;
        `;
        
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('EmUpdSubCode', sql.NVarChar, EmUpdSubCode);
        request.input('SubjectCode', sql.NVarChar, SubjectCode);

        return await request.query(updateQuery); // Removed the unnecessary assignment to 'result'

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};




export default{
    getSuperAuditQAA,
    getAllAssistantQA,
    getIREPORT,
    UpdateSubjectCode,
    getSubjectName,
    UpdateDivisionCode,
    getDivisionName
}