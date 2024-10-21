import config from "../Configuration/config.js";
import sql from "mssql";

const getAllotherSub = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
    
        const query = 'SELECT DeptCode FROM IRUP..DirectorUser WHERE EmployeeCode = @EmployeeCode;';
        
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error executing SQL query in allOtherSubeject:', error);
        throw error;
    }
};

export default{
    getAllotherSub
}