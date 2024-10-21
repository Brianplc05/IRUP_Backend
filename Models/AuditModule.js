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

            FROM IRUP..IRDetails i
            LEFT JOIN [UE Database]..Department d ON i.DeptCode = d.DeptCode
            LEFT JOIN IRUP..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode
            LEFT JOIN IRUP..Users us1 ON irs.EmployeeCode = us1.EmployeeCode
            LEFT JOIN IRUP..IRQATransfer irt ON i.IRNo = irt.IRNo
            LEFT JOIN IRUP..IRSubjectName irs1 ON irt.SubjectCode = irs1.SubjectCode
            LEFT JOIN IRUP..Users us ON irt.EmpTransfer = us.EmployeeCode
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

            FROM IRUP..IRSubjectName i
            LEFT JOIN [UE Database]..vw_Employees e ON i.EmployeeCode = e.CODE
			LEFT JOIN IRUP..IRRiskDictionary irr ON i.SubjectRiskCode = irr.RiskCode
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

const SubjectDetails = async (SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA, EmploCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const SubjectCode = await formatSubCode();

        const insertSNDetails = `
        INSERT INTO IRSubjectName 
        (SubjectCode, SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA, CreatedBy, DateTimeCreated)
        VALUES (@SubjectCode, @SubjectName, @SubjectPolicy, @SubjectRiskCode, @EmployeeCode, @SecondaryQA, @EmploCode, GETDATE())
        
        SELECT TOP 1 * 
        FROM 
            IRUP..IRSubjectName
        ORDER BY 
            DateTimeCreated DESC;`;

        request.input('SubjectCode', sql.NVarChar, SubjectCode);
        request.input('SubjectPolicy', sql.NVarChar, SubjectPolicy);
        request.input('SubjectRiskCode', sql.NVarChar, SubjectRiskCode);
        request.input('SubjectName', sql.NVarChar, SubjectName);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('SecondaryQA', sql.NVarChar, SecondaryQA);
        request.input('EmploCode', sql.NVarChar, EmploCode);

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
                FROM IRUP..IRSubjectName
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
                        FROM IRUP..IRRiskDictionary
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
        FROM IRUP..IRRiskDictionary
        WHERE DomainCode <> 'OTHER'
        ORDER BY DomainCode DESC`;

        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const RiskDic = async (DomainCode, RiskDomain, Risk, RiskDescription, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const RiskCode = await formatRiskCode(DomainCode);

        const insertRiskDictionary = `
            INSERT INTO IRRiskDictionary(DomainCode, RiskDomain, RiskCode, Risk, RiskDescription, CreatedBy, DateTimeCreated)
            VALUES (@DomainCode, @RiskDomain, @RiskCode, @Risk, @RiskDescription, @EmployeeCode, GETDATE())
            
            SELECT TOP 1 * 
            FROM IRRiskDictionary 
            ORDER BY DateTimeCreated DESC`;

        request.input('DomainCode', sql.NVarChar, DomainCode);
        request.input('RiskDomain', sql.NVarChar, RiskDomain);
        request.input('RiskCode', sql.NVarChar, RiskCode);
        request.input('Risk', sql.NVarChar, Risk);
        request.input('RiskDescription', sql.NVarChar, RiskDescription);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

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



const IRAudit = async (note, Id, policyCode, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQuery = `
        INSERT INTO IRNote (IRNo, newNote, policyCode, DateTime, isActive, CreatedBy)
        VALUES (@Id, @newNote, @policyCode, GETDATE(), 1, @EmployeeCode)`;

        request.input('newNote', sql.NVarChar, note);
        request.input('Id', sql.NVarChar, Id);
        request.input('policyCode', sql.NVarChar, policyCode);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

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
        FROM IRUP..IRNote
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

const updNote = async (Id, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        const updateNote = `UPDATE IRUP..IRNote
        SET isActive = 0,
        UpdateActiveBy = @EmployeeCode,
        UpdateActiveDateTime = GETDATE()
        WHERE Id = @Id`;

        request.input('Id', sql.Int, Id);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

        return await request.query(updateNote);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const editNote = async (Id, newNote, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        const EditNote = `
        UPDATE IRUP..IRNote
        SET newNote = @newNote,
        EditNoteBy = @EmployeeCode,
        EditNoteDateTime = GETDATE()
        WHERE Id = @Id;
        `;

        request.input('Id', sql.Int, Id);
        request.input('newNote', sql.NVarChar, newNote);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

        return await request.query(EditNote);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const AuditStatus = async (AuditStatus, IRNo, EmployeeCode) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetails
                    SET AuditStatus = @AuditStatus, 
                    AuditUpdatedby = @EmployeeCode,
                    DateTimeAuditUpdated = GETDATE()
                    WHERE IRNo = @IRNo`;
                
                request.input('AuditStatus', sql.Bit, AuditStatus);
                request.input('IRNo', sql.NVarChar, IRNo);
                request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

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