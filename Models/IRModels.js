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

const IncidentReport = async (EmployeeCode, DeptCode, SubjectCode, SubjectDate, SubjectTime, SubjectLoc, SubjectNote, SubjectCause, SubjectResponse) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const Code = await formatCode();
        const IRNo = await formatIR();
        const insertQueryIRDetails = `
        INSERT INTO IRDetailss 
        (Code, IRNo, EmployeeCode, DeptCode, SubjectCode, SubjectDate, SubjectTime, SubjectLoc, SubjectNote, SubjectCause, SubjectResponse)
        VALUES (@Code, @IRNo, @EmployeeCode, @DeptCode, @SubjectCode, @SubjectDate, @SubjectTime, @SubjectLoc, @SubjectNote, @SubjectCause, @SubjectResponse)
        
        SELECT TOP 1 
        IRD.IRNo, 
        IRS.SubjectCode,
        IRS.SubjectName AS SubjectName,
        IRD.SubjectDate,
        IRD.SubjectTime,
        IRD.SubjectLoc,
        IRD.SubjectNote,
        IRD.SubjectCause,
        IRD.SubjectResponse

        FROM 
            IRDetailss IRD 
        LEFT JOIN 
            testdb..IRSubjectName IRS 
        ON 
            IRD.SubjectCode = IRS.SubjectCode 
        ORDER BY 
            IRD.DateTimeCreated DESC;`;


        request.input('Code', sql.NVarChar, Code);
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('DeptCode', sql.NVarChar, DeptCode);
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

const OtherSubjectIncident = async (IRNo, SpecifiedName) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const SpecifiedCode = await CodeSpecified();

        const insertQueryIRDetails = `
            INSERT INTO IROtherSubjectName (IRNo, SpecifiedCode, SpecifiedName, QAName, QAEmail)
            VALUES (@IRNo, @SpecifiedCode, @SpecifiedName, 'BAYOG, VANGERINE DE MESA.', 'john.brian.palacio@gmail.com')
            
            SELECT TOP 1 
            IRD.IRNo, 
            IRO.SpecifiedCode,
            IRO.SpecifiedName,
            IRO.QAName,
            IRO.QAEmail,
            IRD.SubjectDate,
            IRD.SubjectTime,
            IRD.SubjectLoc,
            IRD.SubjectNote,
            IRD.SubjectCause,
            IRD.SubjectResponse

            FROM 
                IRDetailss IRD 
            LEFT JOIN 
                testdb..IROtherSubjectName IRO
            ON 
                IRD.IRNo = IRO.IRNo 
            ORDER BY 
                IRD.DateTimeCreated DESC;`;

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('SpecifiedCode', sql.NVarChar, SpecifiedCode);
        request.input('SpecifiedName', sql.NVarChar, SpecifiedName);

        return await request.query(insertQueryIRDetails);
    } catch (error) {
        console.error('Error fetching Other Subject Incident:', error); // Handle or log the error
        throw error; // Rethrow the error if necessary
    }
};

async function CodeSpecified() {
    const prefix = 'OT';
    const uniqueNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 999
    return `${prefix}-${uniqueNumber}`;
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














////////////AUDIT////////////////////
const getTab = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `
            SELECT 
                i.IRNo, 
                us.FullName AS TransferFullName,
                CASE
                    WHEN us1.FullName IS NULL THEN 'BAYOG, VANGERINE DE MESA.'
                    ELSE us1.FullName
                END AS MainFullName,
                CASE
                    WHEN irs.SubjectName IS NULL THEN iro.SpecifiedName
                    ELSE irs.SubjectName
                END AS SubjectName,
                d.description AS Department_Description, 
                i.AuditStatus 

            FROM testdb..IRDetailss i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN testdb..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN testdb..Users us1 ON irs.EmployeeCode = us1.EmployeeCode
            LEFT JOIN testdb..IRQATransfer irt ON i.IRNo = irt.IRNo
            LEFT JOIN testdb..IRSubjectName irs1 ON irt.SubjectCode = irs1.SubjectCode
            LEFT JOIN testdb..Users us ON irt.EmpTransfer = us.EmployeeCode
            LEFT JOIN testdb..IROtherSubjectName iro ON i.IRNo = iro.IRNo

                ORDER BY 
                i.AuditStatus DESC,
                i.DateTimeCreated DESC;  `;
        const result = await request.query(display);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getIncident = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `SELECT 
                i.SubjectCode,
                i.SubjectName,
				irr.RiskDomain,
				irr.Risk,
				irr.RiskDescription,
				e.FullName AS QAName

            FROM testdb..IRSubjectName i
            LEFT JOIN [UE Database]..vw_Employees e ON i.EmployeeCode = e.CODE
			LEFT JOIN testdb..IRRiskDictionary irr ON i.SubjectRiskCode = irr.RiskCode

            ORDER BY 
                i.DateTimeCreated DESC`;

        const result = await request.query(display);
        return result;
    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};


const SubjectDetails = async (SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const SubjectCode = await formatSubCode();

        const insertSNDetails = `
        INSERT INTO IRSubjectName 
        (SubjectCode, SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA, CreatedBy, DateTimeCreated)
        VALUES (@SubjectCode, @SubjectName, @SubjectPolicy, @SubjectRiskCode, @EmployeeCode, @SecondaryQA, '9049', GETDATE())
        
        SELECT TOP 1 * 
        FROM 
            testdb..IRSubjectName
        ORDER BY 
            DateTimeCreated DESC;`;

        request.input('SubjectCode', sql.NVarChar, SubjectCode);
        request.input('SubjectPolicy', sql.NVarChar, SubjectPolicy);
        request.input('SubjectRiskCode', sql.NVarChar, SubjectRiskCode);
        request.input('SubjectName', sql.NVarChar, SubjectName);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('SecondaryQA', sql.NVarChar, SecondaryQA);

        const result = await request.query(insertSNDetails);
        return result;


    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }

    async function formatSubCode() {
        try {
            const result = await sql.query('SELECT GETDATE() AS now;');
            const now = result.recordset[0]?.now ?? null;
            const currentDate = now.toISOString().slice(0, 10).replace(/-/g, ''); // Get current date in YYYYMMDD format
            
            const prefix = 'RI';
            
            // Fetch the maximum SubjectCode for the current date to find the last number used
            const numASC = await sql.query(`
                SELECT MAX(SubjectCode) AS LastSubjectCode
                FROM testdb..IRSubjectName
                WHERE SubjectCode LIKE '${prefix}-${currentDate}-%'
            `);
    
            let ascNumber = 1;
            if (numASC.recordset.length > 0 && numASC.recordset[0].LastSubjectCode) {
                const lastSubjectCode = numASC.recordset[0].LastSubjectCode;
    
                // Extract the ascending number part (last part after the last '-')
                const parts = lastSubjectCode.split('-');
                if (parts.length === 3) {
                    const lastAscNumber = parseInt(parts[2], 10);
                    ascNumber = isNaN(lastAscNumber) ? 1 : lastAscNumber + 1;
                }
            }
    
            const nextSubjectCode = `${prefix}-${currentDate}-${ascNumber.toString().padStart(5, '0')}`;
            return nextSubjectCode;
        } catch (error) {
            console.error('Error generating SubjectCode:', error);
            throw error;
        }
    }
    
}

const getRisk = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `SELECT *
                        FROM testdb..IRRiskDictionary
                        ORDER BY 
                            DomainCode DESC,
                            RiskCode ASC;`;

        const result = await request.query(display);
        return result;
    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const RiskDic = async (DomainCode, RiskDomain, Risk, RiskDescription) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const RiskCode = await formatRiskCode(DomainCode);

        const insertRiskDictionary = `
            INSERT INTO IRRiskDictionary(DomainCode, RiskDomain, RiskCode, Risk, RiskDescription, CreatedBy, DateTimeCreated)
            VALUES (@DomainCode, @RiskDomain, @RiskCode, @Risk, @RiskDescription, '9049', GETDATE())
            
            SELECT TOP 1 * 
            FROM IRRiskDictionary 
            ORDER BY DateTimeCreated DESC`;

        request.input('DomainCode', sql.NVarChar, DomainCode);
        request.input('RiskDomain', sql.NVarChar, RiskDomain);
        request.input('RiskCode', sql.NVarChar, RiskCode);
        request.input('Risk', sql.NVarChar, Risk);
        request.input('RiskDescription', sql.NVarChar, RiskDescription);

        const result = await request.query(insertRiskDictionary);
        return result;

    } catch (error) {
        console.error('Error Generating Risk Dictionary:', error);
        throw error;
    }

    async function formatRiskCode(DomainCode) {
        try {
            const pool = await sql.connect(config.pool);
            const result = await pool.request()
                .input('DomainCode', sql.NVarChar, DomainCode)
                .query(`
                    SELECT TOP 1 RiskCode 
                    FROM IRRiskDictionary 
                    WHERE DomainCode = @DomainCode
                    ORDER BY DateTimeCreated DESC
                `);
    
            let ascNumber = 1;
            if (result.recordset.length > 0) {
                const lastRiskCode = result.recordset[0].RiskCode;
                const lastAscNumber = parseInt(lastRiskCode.split('-').pop(), 10);
                ascNumber = lastAscNumber + 1;
            }
    
            const cleanedDomainCode = DomainCode.replace('-', '');
            return `RC-${cleanedDomainCode}-${ascNumber.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error Generating Risk Code:', error);
            throw error;
        }
    }
    
};



const IRAudit = async (note, Id, policyCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQuery = `
        INSERT INTO IRNote (IRNo, newNote, policyCode, DateTime, isActive)
        VALUES (@Id, @newNote, @policyCode, GETDATE(), 1)`;

        request.input('newNote', sql.NVarChar, note);
        request.input('Id', sql.NVarChar, Id);
        request.input('policyCode', sql.NVarChar, policyCode);

        const result = await request.query(insertQuery);
        return result;

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const getNote = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        const auditDis = `
        SELECT *
        FROM testdb..IRNote
        WHERE IRNo = @IRNo
        AND IsActive = 1
        ORDER BY DateTime DESC
        `;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(auditDis);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const updNote = async (Id) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        const updateNote = `UPDATE testdb..IRNote
        SET isActive = 0
        WHERE Id = @Id`;

        request.input('Id', sql.Int, Id);
        return await request.query(updateNote);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const editNote = async (Id, newNote) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        const EditNote = `
        UPDATE testdb..IRNote
        SET newNote = @newNote
        WHERE Id = @Id;
        `;

        request.input('Id', sql.Int, Id);
        request.input('newNote', sql.NVarChar, newNote);
        return await request.query(EditNote);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const AuditStatus = async (AuditStatus, IRNo) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetailss
                    SET AuditStatus = @AuditStatus
                    WHERE IRNo = @IRNo`;
                
                request.input('AuditStatus', sql.Bit, AuditStatus);
                request.input('IRNo', sql.NVarChar, IRNo);

                const result = await request.query(updateQuery);
                return result

            } catch (error) {
                console.error('Error executing SQL query:', error);
                throw error;
            }
}

////////////////////////////////////////








export default{
    IncidentReport,
    OtherSubjectIncident,
    getSubName,
    getSubCategory,
    getQAEmail,
    getED,
    getIRDept,
    IRAudit,
    getIncident,
    getNote,
	getTab,
    getEmploDetails,
    getDept,
    getEmployee,
    // getDepartment,
    updNote,
    editNote,
    getIRCD,
    getIRSpeO,
    AuditStatus,
    SubjectDetails,
    getRisk,
    RiskDic
    
    
}