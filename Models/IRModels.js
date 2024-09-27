import config from "../Configuration/config.js";
import sql from "mssql";

////IRFORM/////

const getED = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT 
            CODE as EmployeeCode, 
            DEPT_CODE as DeptCode, 
            DEPT_DESC
        FROM [UE database]..vw_Employees; `;

        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getSubName = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT 
            irs.SubjectCode, 
            irs.SubjectName,
            irs.SubjectRiskCode,
            irr.DomainCode AS SubjectDomain,
            irr.RiskDescription
        FROM testdb..IRSubjectName irs
        LEFT JOIN testdb..IRRiskDictionary irr ON irs.SubjectRiskCode = irr.RiskCode `;

        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getSubCategory = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT DISTINCT
            DomainCode,
            RiskDomain
        FROM testdb..IRRiskDictionary
        ORDER BY DomainCode ASC`;

        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getDivision = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT DISTINCT
            DivisionCode,
            Division
        FROM testdb..IRDivision
        ORDER BY DivisionCode ASC`;

        const result = await request.query(select);
        return result;      
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getQAEmail = async (SubjectCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `SELECT UERMEmail FROM testdb..Users WHERE SubjectCode LIKE @SubjectCode;`;
        
        request.input('SubjectCode', sql.NVarChar, `%${SubjectCode}%`); // Use backticks to create a string with the wildcard characters
        const result = await request.query(select);
        return result.recordset; // Return only the recordset
    } catch (error) {
        console.error('Error fetching email:', error); // Handle or log the error
        throw error; // Rethrow the error if necessary
    }
}

const IncidentReport = async (EmployeeCode, DeptCode, SubjectCode, DivisionCode, SubjectBriefDes, SubjectDate, SubjectTime, SubjectLoc, SubjectNote, SubjectCause, SubjectResponse) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const Code = await formatCode();
        const IRNo = await formatIR();
        const insertQueryIRDetails = `
        INSERT INTO IRDetailss 
        (Code, IRNo, EmployeeCode, DeptCode, SubjectCode, DivisionCode, SubjectBriefDes, SubjectDate, SubjectTime, SubjectLoc, SubjectNote, SubjectCause, SubjectResponse)
        VALUES (@Code, @IRNo, @EmployeeCode, @DeptCode, @SubjectCode, @DivisionCode, @SubjectBriefDes, @SubjectDate, @SubjectTime, @SubjectLoc, @SubjectNote, @SubjectCause, @SubjectResponse)
        
        SELECT TOP 1 
            IRD.IRNo, 
            IRS.SubjectCode,
            IRS.SubjectName,
            IRD.DivisionCode,
            UAQ.Division,
            CASE 
                WHEN IRD.SubjectCode = 'others' THEN E.FULLNAME 
                ELSE US1.FULLNAME 
            END AS FULLNAME,
            CASE 
                WHEN IRD.SubjectCode = 'others' THEN E.UERMEmail 
                ELSE US1.UERMEmail 
            END AS UERMEmail,
            E1.FULLNAME AS FULLNAME1,  
            E1.UERMEmail AS UERMEmail1,
            IRD.SubjectBriefDes,
            IRD.SubjectDate,
            IRD.SubjectTime,
            IRD.SubjectLoc,
            IRD.SubjectNote,
            IRD.SubjectCause,
            IRD.SubjectResponse
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
        LEFT JOIN 
            testdb..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
        ORDER BY 
            IRD.DateTimeCreated DESC;
        `;


        request.input('Code', sql.NVarChar, Code);
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('DeptCode', sql.NVarChar, DeptCode);
        request.input('DivisionCode', sql.NVarChar, DivisionCode);
        request.input('SubjectBriefDes', sql.NVarChar, SubjectBriefDes);
        request.input('SubjectCode', sql.NVarChar, SubjectCode);
        request.input('SubjectDate', sql.NVarChar, SubjectDate);
        request.input('SubjectTime', sql.NVarChar, SubjectTime);
        request.input('SubjectLoc', sql.NVarChar, SubjectLoc);
        request.input('SubjectNote', sql.NVarChar, SubjectNote);
        request.input('SubjectCause', sql.NVarChar, SubjectCause);
        request.input('SubjectResponse', sql.NVarChar, SubjectResponse);

        return await request.query(insertQueryIRDetails);

    }catch (error) {
            console.error('Error executing SQL query:', error);
            throw error;
    }

    async function formatIR() {
        const result = await sql.query('SELECT GETDATE() AS now;');
        const now = result.recordset[0]?.now ?? null;
        const currentDate = now.toISOString().slice(0, 10).replace(/-/g, ''); // Get current date in YYYYMMDD format
        const currentYear = now.getFullYear(); 
        const numASC = await sql.query(`
            SELECT TOP 1 IRNo
            FROM testdb..IRDetailss
            WHERE IRNo LIKE '${currentYear}%'
            ORDER BY Id DESC;
        `);
        let ascNumber = 1;
        if (numASC.recordset.length > 0) {
            const lastIRNo = numASC.recordset[0].IRNo;
            const lastAscNumber = parseInt(lastIRNo.split('-')[1], 10);
            ascNumber = lastAscNumber + 1;
        }
        const uniqueNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // Generate a random number between 00 and 99
        return `${currentDate}-${ascNumber.toString().padStart(5, '0')}-${uniqueNumber}`;
    }

    async function formatCode() {
        const prefix = 'CODE';
        const uniqueNumber = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 999
        const result = await sql.query('SELECT GETDATE() AS now;');
        const now = result.recordset[0]?.now ?? null;
        const currentDate = now.toISOString().slice(0, 10).replace(/-/g, ''); // Get current date in YYYYMMDD format
        return `${prefix}-${currentDate}-${uniqueNumber}`;
    }
}

const getIRDept = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = ` SELECT DeptCode, Dept_Desc
        FROM testdb..IREmail
        ORDER BY Dept_Desc ASC;
        `;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


////////////////////////////////////////





////HRTABLE/////


const getIRCD = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = ` SELECT DisciplineCode, DisciplineName FROM testdb..IRCodeDiscipline;`;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getIRSpeO = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `SELECT SpecificOfNo, DisciplineCode, SpecificOffenses FROM testdb..IRSpecificOffenses;`;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}
////////////////////////////////////////














////HRDEMERIT/////

const getDept = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `
        SELECT 
        D.description AS Department_Description,
        D.demerits
        FROM
            testdb..DepartmentDem DD
        LEFT JOIN 
            [UE Database]..Department D ON DD.DeptCode = D.DeptCode
        `;
        const result = await request.query(display);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getEmploDetails = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `
        SELECT 
            E.EmployeeCode,
            CONCAT(LastName, ', ', FirstName, ' ', CASE WHEN MiddleName IS NOT NULL THEN LEFT(MiddleName, 1) + '.' ELSE '' END) AS FullName
        FROM 
            [UE database]..Employee E
        WHERE 
            E.Isactive = 1;
        `;
        const result = await request.query(display);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getEmployee = async (IRNo, EmployeeCode, DisciplineCode, SpecificOfNo,  Penalties, Occurrence ) =>{
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertEmployee = `
        INSERT INTO IREmployeeDem(IRNo, EmployeeCode, DisciplineCode, SpecificOfNo, Penalties, Occurrence, DateTimeCreated)
        VALUES (@IRNo, @EmployeeCode, @DisciplineCode, @SpecificOfNo, @Penalties, @Occurrence, GETDATE())`;

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('DisciplineCode', sql.NVarChar, DisciplineCode);
        request.input('SpecificOfNo', sql.NVarChar, SpecificOfNo);
        request.input('Penalties', sql.NVarChar, Penalties);
        request.input('Occurrence', sql.NVarChar, Occurrence)

        const result = await request.query(insertEmployee);
        return result;
    }catch (error) {
        console.error('Error executing Employee SQL query:', error);
        throw error;
    }
};

// const getDepartment = async (IRNo, DeptCode, demerits) => {
//     try{
//         const pool = await sql.connect(config.pool);
//         const request = pool.request();

//         const insertDepartment = `
//         INSERT INTO DepartmentDem (IRNo, DeptCode, demerits, dateTime)
//         VALUES (@IRNo, @DeptCode, @demerits, GETDATE())`;

//         request.input('IRNo', sql.NVarChar, IRNo);
//         request.input('DeptCode', sql.NVarChar, DeptCode);
//         request.input('demerits', sql.Int, demerits);

//         const result = await request.query(insertDepartment);
//         return result;
//     }catch (error) {
//         console.error('Error executing Deoartment SQL query:', error);
//         throw error;
//     }
// };
////////////////////////////////////////



export default{
    IncidentReport,
    getSubName,
    getSubCategory,
    getDivision,
    getQAEmail,
    getED,
    getIRDept,
    getEmploDetails,
    getDept,
    getEmployee,
    // getDepartment,
    getIRCD,
    getIRSpeO
    
    
}