import config from "../Configuration/config.js";
import sql from "mssql";

const getAllAssistantQA = async (EmployeeCode) => {
    try {
    
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const sqlQuery = `            
            SELECT 
                i.IRNo, 
                d.description AS Department_Description,
                uaq.Division,
                uaq.DivisionCode,
                irs.SubjectCode
            FROM testdb..IRDetailss i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN testdb..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN testdb..IRDivision uaq ON i.DivisionCode = uaq.DivisionCode
            WHERE 
                irs.SubjectCode = 'others' 
                AND (uaq.QA = @EmployeeCode OR uaq.QAAssitant = @EmployeeCode)
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
                testdb..IRDetailss IRD
            LEFT JOIN testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
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
            FROM testdb..IRDivision
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
            FROM testdb..IRSubjectName 
            WHERE SubjectCode <> 'others';
            `;

        const result = await request.query(selectQuery);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const UpdateDivisionCode = async (IRNo, DivisionCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const updateQuery = `
            UPDATE IRDetailss
            SET DivisionCode = @DivisionCode
            WHERE IRNo = @IRNo;
            
            SELECT TOP 1
                IRD.IRNo, 
                IRD.DivisionCode,
                IRD.SubjectBriefDes,
                E.FULLNAME AS TransferQAName,
                E.UERMEmail AS TransferQAEmail,
				E1.FULLNAME AS TransferQAAName,
                E1.UERMEmail AS TransferQAAEmail

            FROM 
                testdb..IRDetailss IRD 
            LEFT JOIN 
                testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode 
            LEFT JOIN 
                testdb..IRDivision UAQ ON IRD.DivisionCode = UAQ.DivisionCode
			LEFT JOIN
                [UE database]..vw_Employees E ON UAQ.QA = E.CODE
            LEFT JOIN
                [UE database]..vw_Employees E1 ON UAQ.QAAssitant = E1.CODE
			WHERE
                IRD.IRNo = @IRNo
            ORDER BY 
                IRD.DateTimeCreated DESC;`;


        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('DivisionCode', sql.NVarChar, DivisionCode);

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
            UPDATE testdb..IRDetailss
            SET 
                SubjectCode = @SubjectCode, 
                EmUpdSubCode = @EmUpdSubCode,
                EmDateUpdSubCode = GETDATE()  -- Correctly using GETDATE() function
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
                testdb..IRDetailss IRD 
            LEFT JOIN 
                testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode 
            LEFT JOIN 
                testdb..IRDivision UAQ ON IRD.DivisionCode = UAQ.DivisionCode
            LEFT JOIN
                [UE database]..vw_Employees E ON IRD.EmUpdSubCode = E.CODE
            LEFT JOIN 
                testdb..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
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
    getAllAssistantQA,
    getIREPORT,
    UpdateSubjectCode,
    getSubjectName,
    UpdateDivisionCode,
    getDivisionName
}