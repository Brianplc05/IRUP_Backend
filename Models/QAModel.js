import config from "../Configuration/config.js";
import sql from "mssql";

const getSuperAuditQA = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
            SELECT
                IRD.IRNo,
                US.FullName AS TransferFullName,
                US1.FullName AS MainFullName,
                IRD.DeptCode AS Department_Code,
                IRS.SubjectCode,
                IRS.SubjectName,
                IRS.EmployeeCode,
                IRD.RCA,
                IRD.lostRec,
                D.description AS Department_Description,
                IRI.PrimaryDept,
                IRA.CombinedActionItems,
                IRE.Dept_Desc AS Department_Involved,
                IRD.QAStatus
            FROM
                IRUP..IRDetails IRD
                LEFT JOIN IRUP..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
                LEFT JOIN IRUP..IREmail IRE ON IRI.PrimaryDept = IRE.DeptCode
                LEFT JOIN [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
                LEFT JOIN IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
                LEFT JOIN IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
                LEFT JOIN IRUP..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
                LEFT JOIN IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
                LEFT JOIN IRUP..Users US ON IRT.EmpTransfer = US.EmployeeCode
                LEFT JOIN (
                    SELECT 
                        IRNo,
                        STRING_AGG(ActionStatus, ', ') AS CombinedActionItems
                    FROM
                        IRUP..IRActionItems
                    GROUP BY IRNo
                ) IRA ON IRD.IRNo = IRA.IRNo
            WHERE
                IRS.SubjectCode != 'others'
            ORDER BY
                IRD.QAStatus DESC,
                IRD.DateTimeCreated DESC;`;
                
        const result = await request.query(select);
        return result; 
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const getAllQA = async (EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
            SELECT
                IRD.IRNo,
                US.FullName AS TransferFullName,
                US1.FullName AS MainFullName,
                IRD.DeptCode AS Department_Code,
                IRS.SubjectCode,
                IRS.SubjectName,
                IRS.EmployeeCode,
                IRD.RCA,
                IRD.lostRec,
                D.description AS Department_Description,
                IRI.PrimaryDept,
                IRA.CombinedActionItems,
                IRE.Dept_Desc AS Department_Involved,
                IRD.QAStatus
            FROM
                IRUP..IRDetails IRD
                LEFT JOIN IRUP..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
                LEFT JOIN IRUP..IREmail IRE ON IRI.PrimaryDept = IRE.DeptCode
                LEFT JOIN [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
                LEFT JOIN IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
                LEFT JOIN IRUP..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
                LEFT JOIN IRUP..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
                LEFT JOIN IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
                LEFT JOIN IRUP..Users US ON IRT.EmpTransfer = US.EmployeeCode
                LEFT JOIN (
                    SELECT 
                        IRNo,
                        STRING_AGG(ActionStatus, ', ') AS CombinedActionItems
                    FROM
                        IRUP..IRActionItems
                    GROUP BY IRNo
                ) IRA ON IRD.IRNo = IRA.IRNo
            WHERE
                IRS.SubjectCode != 'others' 
                AND IRS.EmployeeCode = @EmployeeCode
            ORDER BY
                IRD.QAStatus DESC,
                IRD.DateTimeCreated DESC;
        `;

        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getIREPORT = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const select = `
            SELECT 
                IRD.IRNo,
                IRS.SubjectName,
                IRD.SubjectDate,
                IRD.SubjectTime,
                IRD.SubjectLoc,
                IRD.SubjectNote,
                IRD.SubjectCause,
                IRD.SubjectResponse,
                IRD.DateTimeCreated,
                IRA.CombinedActionItems AS ActionItem,
                DeptDesc.PrimaryDept,
                DeptDesc.DeptCodeInvDescriptions
                
            FROM
                IRUP..IRDetails IRD
            LEFT JOIN IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN (
                SELECT 
                    ID.IRNo,
                    D1.Dept_Desc AS PrimaryDept,
                    STRING_AGG(D2.Dept_Desc, ', ') AS DeptCodeInvDescriptions
                FROM 
                    IRUP..IRDeptInvolved ID
                LEFT JOIN IRUP..IREmail D1 ON ID.PrimaryDept = D1.DeptCode
                CROSS APPLY STRING_SPLIT(ID.DeptCodeInv, ',') AS SplitDeptCode
                LEFT JOIN IRUP..IREmail D2 ON SplitDeptCode.value = D2.DeptCode
                GROUP BY ID.IRNo, D1.Dept_Desc
            ) DeptDesc ON IRD.IRNo = DeptDesc.IRNo
            LEFT JOIN (
                SELECT 
                    IRNo,
                    STRING_AGG(ActionItem, '. ') AS CombinedActionItems
                FROM
                    IRUP..IRActionItems
                GROUP BY IRNo
            ) IRA ON IRD.IRNo = IRA.IRNo
            WHERE
                IRD.IRNo = @IRNo;
        `;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(select);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const IRQA = async (IRNo, PrimaryDept, DeptCodeInv, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQueryIRDetails = `
        INSERT INTO IRDeptInvolved (IRNo, PrimaryDept, DeptCodeInv, CreatedBy , DateTimeCreated)
        VALUES (@IRNo, @PrimaryDept, @DeptCodeInv, @EmployeeCode, GETDATE());

        UPDATE IRUP..IRDetails
        SET RCA = '1',
            DateTimeRCAUpdated = GETDATE()
        WHERE IRNo = @IRNo;

        SELECT TOP 1
            i.IRNo,
            i.PrimaryDept,
            i.DeptCodeInv,
            i.DateTimeCreated,	
			irs.SubjectCode,
            irs.SubjectName,
            u.UERMEmail,
            e.UERMEmail AS transferEmail,
            d.SubjectNote,
            d.SubjectCause,
            d.SubjectResponse
        FROM
            IRUP..IRDeptInvolved i
        LEFT JOIN
            IRUP..IRDetails d ON i.IRNo = d.IRNo
        LEFT JOIN
            IRUP..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
        LEFT JOIN
            [UE Database]..vw_Employees u ON irs.EmployeeCode = u.CODE 
        LEFT JOIN 
            IRUP..IRQATransfer irt ON i.IRNo = irt.IRNo
        LEFT JOIN 
            IRUP..IRSubjectName irsn ON irt.SubjectCode = irsn.SubjectCode
        LEFT JOIN 
            [UE Database]..vw_Employees e ON irt.EmpTransfer = e.CODE
        WHERE i.IRNo = @IRNo;        
        `;
    
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('PrimaryDept', sql.NVarChar, PrimaryDept);
        request.input('DeptCodeInv', sql.NVarChar, DeptCodeInv.join(',')); // Join values with comma delimite

        return await request.query(insertQueryIRDetails);
        
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getQAs = async () => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `SELECT EmployeeCode, FullName
        FROM IRUP..Users
        ORDER BY FullName ASC;
        `;

        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const putQATras = async (IRNo, SubjectCode, EmpTransfer) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('SubjectCode', sql.NVarChar, SubjectCode);
        request.input('EmpTransfer', sql.NVarChar, EmpTransfer);

        const updateQuery = `
        INSERT INTO IRQATransfer (IRNo, SubjectCode, EmpTransfer)
        VALUES (@IRNo, @SubjectCode, @EmpTransfer);
        
        SELECT TOP 1
            IRQ.IRNo,
            IRS.SubjectName,
            E.FullName AS TransferFullName,
            E.UERMEmail AS TransEmail,
            E1.FullName AS MainFullName,
            E1.UERMEmail AS MainEmail
        FROM IRUP..IRQATransfer IRQ
        LEFT JOIN IRUP..IRSubjectName IRS ON IRQ.SubjectCode = IRS.SubjectCode
        LEFT JOIN [UE Database]..vw_Employees E1 ON IRS.EmployeeCode = E1.CODE
        LEFT JOIN IRUP..IRQATransfer IRT ON IRQ.IRNo = IRT.IRNo
        LEFT JOIN IRUP..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
        LEFT JOIN [UE Database]..vw_Employees E ON IRT.EmpTransfer = E.CODE
        ORDER BY 
            IRQ.DateTimeCreated DESC;`;

        const result = await request.query(updateQuery);
        return result.recordset[0]; // Assuming you want the first record from the result
    } catch (error) {
        console.error('Error updating QA Transfer:', error);
        throw error;
    }
};


const getEmail = async (DeptCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `SELECT FullName, UERMEmail FROM IRUP..IREmail WHERE DeptCode = @DeptCode`;
        
        request.input('DeptCode', sql.NVarChar, DeptCode);
        const result = await request.query(select);
        return result.recordset; // Return only the recordset
    } catch (error) {
        console.error('Error fetching email:', error); // Handle or log the error
        throw error; // Rethrow the error if necessary
    }
}

const getDirectorEmail = async (DeptCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        
        const select = `
        SELECT Fullname, UERMEmail
        FROM IRUP..DirectorUser
        WHERE DeptCode = @DeptCode
        `;
        
        request.input('DeptCode', sql.NVarChar, DeptCode);
        const result = await request.query(select);
        return result.recordset; // Return only the recordset
    } catch (error) {
        console.error('Error fetching email:', error); // Handle or log the error
        throw error; // Rethrow the error if necessary
    }
};


const IRQARef = async (IRNo, QAReferral) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('QAReferral', sql.Int, QAReferral);

        const updateQuery = `
            UPDATE IRDetails
            SET QAReferral = @QAReferral,
                QAStatus = 0,
                DateTimeQAUpdated = GETDATE(),
                DateTimeRCAUpdated = GETDATE()
            WHERE IRNo = @IRNo;
        `;
        const result = await request.query(updateQuery);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};


const IRReCons = async (IRNo, newConclusion) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('newConclusion', sql.NVarChar, newConclusion);
        

        const insertQuery = `
        INSERT INTO IRConclusion (IRNo, newConclusion, DateTime)
        VALUES (@IRNo, @newConclusion, GETDATE());
        `;

        const result = await request.query(insertQuery);
        return result;

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const approvedRCA = async (IRNo, ActionItem, TimelineFromDate, TimelineToDate, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('ActionItem', sql.NVarChar, ActionItem);
        request.input('TimelineFromDate', sql.Date, TimelineFromDate);
        request.input('TimelineToDate', sql.Date, TimelineToDate);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);

        const insertQuery = `
        INSERT INTO IRActionItems (IRNo, ActionItem, TimelineFromDate, TimelineToDate, DateTimeCreated, CreatedBy)
        VALUES (@IRNo, @ActionItem, @TimelineFromDate, @TimelineToDate, GETDATE(), @EmployeeCode);
        
        UPDATE IRDetails
        SET RCA = '3'
        WHERE IRNo = @IRNo;
        `;

        return await request.query(insertQuery);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const selectApprovedRCA = async (IRNo) => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);

        const select = `
            SELECT 
                ira.IRNo,
                ira.ActionItem,
                irs.SubjectName,
                ire1.FULLNAME AS PrimaryName,
                ire1.UERMEmail AS PrimaryEmail,
                us.FULLNAME AS QAName,
                us.UERMEmail AS QAEmail
                
            FROM 
                IRUP..IRActionItems ira 
            LEFT JOIN IRUP..IRDetails d ON ira.IRNo = d.IRNo
            LEFT JOIN IRUP..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
            LEFT JOIN IRUP..IRDeptInvolved ird ON ira.IRNo = ird.IRNo
            LEFT JOIN IRUP..IREmail ire1 ON ird.PrimaryDept = ire1.DeptCode
            LEFT JOIN IRUP..Users us ON irs.EmployeeCode = us.EmployeeCode
            WHERE ira.IRNo = @IRNo
        `;
        
        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const disapprovedRCA = async (IRNo, newConclusion) => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('newConclusion', sql.NVarChar, newConclusion);

        const insertRCADisapproved = `
        INSERT INTO IRConclusion (IRNo, newConclusion, DateTime)
        VALUES (@IRNo, @newConclusion, GETDATE());
        
        UPDATE IRDetails
        SET RCA = '2'
        WHERE IRNo = @IRNo;
        
        SELECT TOP 1 
            irc.IRNo,
            irs.SubjectName AS SubjectName,
            irc.newConclusion,
            e.FULLNAME as PrimaryName,
            e.UERMEmail as PrimaryEmail,
            us.FULLNAME AS QAName,
            us.UERMEmail AS QAEmail
            
        FROM 
            IRUP..IRConclusion irc
        LEFT JOIN
            IRUP..IRDetails d ON irc.IRNo = d.IRNo
        LEFT JOIN
            IRUP..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
        LEFT JOIN 
            IRUP..IRDeptInvolved ird ON irc.IRNo = ird.IRNo
        LEFT JOIN 
            IRUP..IREmail e ON ird.PrimaryDept = e.DeptCode
		LEFT JOIN 
            IRUP..Users us ON irs.EmployeeCode = us.EmployeeCode
        WHERE irc.IRNo = @IRNo`;

        return await request.query(insertRCADisapproved);

    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}


const countRcaSTA = async (CountRCA, Id) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetails
                    SET CountReturnRCA = CountReturnRCA + @CountRCA
                    WHERE IRNo = @Id`;
                
                request.input('CountRCA', sql.Int, CountRCA);
                request.input('Id', sql.NVarChar, Id);

                const result = await request.query(updateQuery);
                return result

            } catch (error) {
                console.error('Error executing SQL query:', error);
                throw error;
            }
}

const DisActioItem = async (IRNo) => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);

        const select = `
            SELECT * FROM IRUP..IRActionItems
            WHERE IRNo = @IRNo;
        `;
        
        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const AcionItemStatus = async (Id, ActionStatus, EmployeeCode) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('Id', sql.Int, Id);
        request.input('EmployeeCode', sql.NVarChar, EmployeeCode);
        request.input('ActionStatus', sql.Int, ActionStatus);

        const updateActionItem = `
        UPDATE IRActionItems
        SET ActionStatus = @ActionStatus,
            UpdatedBy = @EmployeeCode,
            DateTimeUpdated = GETDATE()
        WHERE Id = @Id`;

        const result = await request.query(updateActionItem);
        return result;
    } catch (error) {
        throw error; // Just rethrowing the error without logging it
    }
};


const getPendingRemarks = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const DispendingRem = `
        SELECT *
        FROM IRUP..IRPendingRemarks
        WHERE IRNo = @IRNo
        ORDER BY DateTimeCreated DESC
        `;

        request.input('IRNo', sql.NVarChar, IRNo);
        return await request.query(DispendingRem);

    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const IRPendingRem = async (IRNo, PendingRemarks) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('PendingRemarks', sql.NVarChar, PendingRemarks);

        const insertQuery = `
        INSERT INTO IRPendingRemarks (IRNo, PendingRemarks, DateTimeCreated)
        VALUES (@IRNo, @PendingRemarks, GETDATE());
        `;

        const result = await request.query(insertQuery);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
};

const QAStatus = async ( IRNo, QAStatus) => {
    try {
                const pool = await sql.connect(config.pool);
                const request = pool.request();
                
                const updateQuery = `
                    UPDATE IRDetails
                    SET 
                        QAStatus = @QAStatus,
                        DateTimeQAUpdated = GETDATE()
                    WHERE 
                        IRNo = @IRNo;
                    `;
                                    
                request.input('IRNo', sql.NVarChar, IRNo);
                request.input('QAStatus', sql.Bit, QAStatus);

                const result = await request.query(updateQuery);
                return result;

            } catch (error) {
                console.error('Error executing SQL query:', error);
                throw error;
            }
}

const getTime = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const result = await request.query(`
        SELECT
            i.IRNo, 
            i.DateTimeCreated, 
            i.DateTimeRCAUpdated, 
            irs.SubjectName AS SubjectName,
            ue.UERMEmail AS QAEmail,
            ue.FULLNAME,
            i.SendEmailCounts
        FROM 
            IRUP..IRDetails i
        LEFT JOIN IRUP..IRDeptInvolved id ON i.IRNo = id.IRNo
        LEFT JOIN IRUP..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode 
        LEFT JOIN [UE Database]..vw_Employees ue ON irs.EmployeeCode = ue.CODE
        WHERE i.SubjectCode <> 'others'
        AND i.DateTimeRCAUpdated IS NULL;
        `);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const updateSendEmailCounts = async (IRNo, SendEmailCounts) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const updateQuery = `
            UPDATE IRDetails
            SET SendEmailCounts = @SendEmailCounts
            WHERE IRNo = @IRNo`;
                    
        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('SendEmailCounts', sql.Int, SendEmailCounts);  // Changed to Int assuming it's a count

        const result = await request.query(updateQuery);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}    


export default{
    getSuperAuditQA,
    getAllQA,
    getIREPORT,
    IRQA,
    IRQARef,
    getQAs,
    putQATras,
    getEmail,
    getDirectorEmail,
    approvedRCA,
    selectApprovedRCA,
    disapprovedRCA,
    IRReCons,
    countRcaSTA,
    DisActioItem,
    AcionItemStatus,
    QAStatus,
    getPendingRemarks,
    IRPendingRem,
    getTime,
    updateSendEmailCounts
    
}