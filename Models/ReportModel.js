

import config from "../Configuration/config.js";
import sql from "mssql";

const getNumberofSubject = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT 
            irs.SubjectCode,
            COUNT(ird.SubjectCode) AS SubjectCodeCount
        FROM 
            IRUP..IRSubjectName irs
        LEFT JOIN 
            IRUP..IRDetails ird ON irs.SubjectCode = ird.SubjectCode
        GROUP BY 
            irs.SubjectCode 
        ORDER BY 
            irs.SubjectCode;`;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing report query:', error);
        throw error;
    }
}

const getMatchDepartment = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT 
            SUM(CASE WHEN irv.PrimaryDept = ird.DeptCode THEN 1 ELSE 0 END) AS MatchCount,
            SUM(CASE WHEN irv.PrimaryDept <> ird.DeptCode THEN 1 ELSE 0 END) AS NoMatchCount
        FROM 
            IRUP..IRDeptInvolved irv 
        LEFT JOIN 
            IRUP..IRDetails ird ON irv.IRNo = ird.IRNo;
        `;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing report query:', error);
        throw error;
    }
}

const getTotalActionItem = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = ` 
        SELECT 
            COUNT(*) AS TotalActionItems,
            SUM(CASE WHEN ActionStatus = 2 THEN 1 ELSE 0 END) AS ActionStatus2Count
        FROM 
            IRUP..IRActionItems;
        `;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing report query:', error);
        throw error;
    }
}


export default { 
    getNumberofSubject, 
    getMatchDepartment,
    getTotalActionItem
}
    