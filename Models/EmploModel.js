import config from "../Configuration/config.js";
import sql from "mssql";

const DisplayEmplo = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const getdisplayEmplo = `
        WITH RankedRows AS (
            SELECT 
                ie.IRNo, 
                ircd.DisciplineName, 
                ie.DateTimeCreated,
                ROW_NUMBER() OVER (PARTITION BY ie.IRNo ORDER BY ie.DateTimeCreated) AS RowNum
            FROM [IRUP].[dbo].[IREmployeeDem] ie
            LEFT JOIN IRUP..IRCodeDiscipline ircd ON ie.DisciplineCode = ircd.DisciplineCode
            LEFT JOIN IRUP..IRSpecificOffenses iso ON ie.SpecificOfNo = iso.SpecificOfNo
        )
        SELECT 
            IRNo, 
            DisciplineName, 
            DateTimeCreated
        FROM RankedRows
        WHERE RowNum = 1
        ORDER BY
            DateTimeCreated DESC;
        `;

        const result = await request.query(getdisplayEmplo);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const DisDemerit = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const displayDem = ` SELECT DISTINCT e.FULLNAME, ircd.DisciplineName, iso.SpecificOffenses, ie.Occurrence, ie.Penalties
        FROM [IRUP].[dbo].[IREmployeeDem] ie
        LEFT JOIN IRUP..IRCodeDiscipline ircd ON ie.DisciplineCode = ircd.DisciplineCode
        LEFT JOIN IRUP..IRSpecificOffenses iso ON ie.SpecificOfNo = iso.SpecificOfNo 
        LEFT JOIN [UE database]..vw_Employees e ON ie.EmployeeCode = e.CODE
        WHERE
            ie.IRNo = @IRNo`;

        request.input('IRNo', sql.NVarChar, IRNo);
        const result = await request.query(displayDem);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

export default{
    DisplayEmplo,
    DisDemerit

}