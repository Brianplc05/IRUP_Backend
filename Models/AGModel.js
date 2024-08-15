import config from "../Configuration/config.js";
import sql from "mssql";

const getgoogleUser = async (UERMEmail) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        request.input('UERMEmail', sql.VarChar, UERMEmail);

        const query = `SELECT 
                            E.DeptCode,
                            E.EmployeeCode,
                            E.FirstName,
                            E.UERMEmail,
                            CONCAT(LastName, ', ', FirstName, ' ', CASE WHEN MiddleName IS NOT NULL THEN LEFT(MiddleName, 1) + '.' ELSE '' END) AS FullName,
                            D.description AS Department_Description
                        FROM 
                            [UE database]..Employee E
                        LEFT JOIN 
                            [UE Database]..Department D ON E.DeptCode = D.DeptCode
                        WHERE 
                            E.UERMEmail = @UERMEmail;`
        const result = await request.query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

export default {
    getgoogleUser
}

