import config from "../Configuration/config.js";
import sql from "mssql";

const getUser = async (EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        // Use input parameters to prevent SQL injection and properly pass the EmployeeCode
        request.input('EmployeeCode', sql.VarChar, EmployeeCode);

        const query = `SELECT 
                            E.DeptCode,
                            E.EmployeeCode,
                            E.FirstName,
                            WebPassword,
                            CONCAT(LastName, ', ', FirstName, ' ', CASE WHEN MiddleName IS NOT NULL THEN LEFT(MiddleName, 1) + '.' ELSE '' END) AS FullName,
                            D.description AS Department_Description
                        FROM 
                            [UE database]..Employee E
                        LEFT JOIN 
                            [UE Database]..Department D ON E.DeptCode = D.DeptCode
                        WHERE 
                            E.EmployeeCode = @EmployeeCode;`
        const result = await request.query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

export default {
    getUser
}
