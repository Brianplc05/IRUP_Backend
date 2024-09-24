import config from "../Configuration/config.js";
import sql from "mssql";

const getTab = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const display = `
            SELECT 
                i.IRNo, 
                us.FullName AS TransferFullName,
                us1.FullName AS MainFullName,
                irs.SubjectName,
                d.description AS Department_Description, 
                i.AuditStatus 

            FROM testdb..IRDetailss i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN testdb..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN testdb..Users us1 ON irs.EmployeeCode = us1.EmployeeCode
            LEFT JOIN testdb..IRQATransfer irt ON i.IRNo = irt.IRNo
            LEFT JOIN testdb..IRSubjectName irs1 ON irt.SubjectCode = irs1.SubjectCode
            LEFT JOIN testdb..Users us ON irt.EmpTransfer = us.EmployeeCode
            WHERE
                IRS.SubjectCode != 'others'

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
                irr.DomainCode,
                i.SubjectCode,
                i.SubjectName,
				irr.RiskDomain,
				irr.Risk,
				irr.RiskDescription,
				e.FullName AS QAName

            FROM testdb..IRSubjectName i
            LEFT JOIN [UE Database]..vw_Employees e ON i.EmployeeCode = e.CODE
			LEFT JOIN testdb..IRRiskDictionary irr ON i.SubjectRiskCode = irr.RiskCode
			WHERE i.SubjectCode <> 'others' 
            ORDER BY 
                i.SubjectCode ASC,
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
            const { recordset } = await sql.query('SELECT GETDATE() AS now;');
            const currentDate = recordset[0].now.toISOString().slice(0, 10).replace(/-/g, '');
            const prefix = 'RI';
    
            const { recordset: maxCodeRecordset } = await sql.query(`
                SELECT MAX(SubjectCode) AS LastSubjectCode
                FROM testdb..IRSubjectName
                WHERE SubjectCode <> 'others'
            `);
    
            const lastCode = maxCodeRecordset[0].LastSubjectCode;
            const lastNumber = lastCode ? parseInt(lastCode.split('-')[2], 10) + 1 : 1;
    
            return `${prefix}-${currentDate}-${String(lastNumber).padStart(5, '0')}`;
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

        const display = `SELECT DomainCode, RiskDomain, RiskCode, Risk, RiskDescription
                        FROM testdb..IRRiskDictionary
                        WHERE DomainCode <> 'OTHER'
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

const getDomainCode = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
        SELECT DISTINCT
            DomainCode,
            RiskDomain
        FROM testdb..IRRiskDictionary
        WHERE DomainCode <> 'OTHER'
        ORDER BY DomainCode DESC`;

        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


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


export default{
    getTab,
    getIncident,
    SubjectDetails,
    getRisk,
    getDomainCode,
    RiskDic,
    IRAudit,
    getNote,
    updNote,
    editNote,
    AuditStatus

}