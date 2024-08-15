import config from "../Configuration/config.js";
import sql from "mssql";

const getAllQA = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        const select = `
            SELECT
                IRD.IRNo,
                US.FullName AS TransferFullName,
                CASE
                    WHEN US1.FullName IS NULL THEN 'BAYOG, VANGERINE DE MESA.'
                    ELSE US1.FullName
                END AS MainFullName,
                IRD.DeptCode AS Department_Code,
                CASE
                    WHEN IRS.SubjectCode IS NULL THEN IRO.SpecifiedCode
                    ELSE IRS.SubjectCode
                END AS SubjectCode,
                CASE
                    WHEN IRS.SubjectName IS NULL THEN IRO.SpecifiedName
                    ELSE IRS.SubjectName
                END AS SubjectName,
                IRD.RCA,
                IRD.lostRec,
                D.description AS Department_Description,
                IRI.PrimaryDept,
                IRA.CombinedActionItems,
                IRE.Dept_Desc AS Department_Involved,
                IRD.QAStatus
            FROM
                testdb..IRDetailss IRD
                LEFT JOIN testdb..IRDeptInvolved IRI ON IRD.IRNo = IRI.IRNo
                LEFT JOIN testdb..IREmail IRE ON IRI.PrimaryDept = IRE.DeptCode
                LEFT JOIN [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
                LEFT JOIN testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
                LEFT JOIN testdb..Users US1 ON IRS.EmployeeCode = US1.EmployeeCode
                LEFT JOIN testdb..IRQATransfer IRT ON IRD.IRNo = IRT.IRNo
                LEFT JOIN testdb..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
                LEFT JOIN testdb..Users US ON IRT.EmpTransfer = US.EmployeeCode
                LEFT JOIN testdb..IROtherSubjectName IRO ON IRD.IRNo = IRO.IRNo
                LEFT JOIN (
                    SELECT 
                        IRNo,
                        STRING_AGG(ActionStatus, ', ') AS CombinedActionItems
                    FROM
                        testdb..IRActionItems
                    GROUP BY IRNo
                ) IRA ON IRD.IRNo = IRA.IRNo
            ORDER BY
                IRD.QAStatus DESC,
                IRD.DateTimeCreated DESC;

        `;

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
                CASE
                    WHEN IRS.SubjectName IS NULL THEN IRO.SpecifiedName
                    ELSE IRS.SubjectName
                END AS SubjectName,
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
                testdb..IRDetailss IRD
            LEFT JOIN testdb..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
            LEFT JOIN (
                SELECT 
                    ID.IRNo,
                    D1.Dept_Desc AS PrimaryDept,
                    STRING_AGG(D2.Dept_Desc, ', ') AS DeptCodeInvDescriptions
                FROM 
                    testdb..IRDeptInvolved ID
                LEFT JOIN testdb..IREmail D1 ON ID.PrimaryDept = D1.DeptCode
                CROSS APPLY STRING_SPLIT(ID.DeptCodeInv, ',') AS SplitDeptCode
                LEFT JOIN testdb..IREmail D2 ON SplitDeptCode.value = D2.DeptCode
                GROUP BY ID.IRNo, D1.Dept_Desc
            ) DeptDesc ON IRD.IRNo = DeptDesc.IRNo
            LEFT JOIN (
                SELECT 
                    IRNo,
                    STRING_AGG(ActionItem, '. ') AS CombinedActionItems
                FROM
                    testdb..IRActionItems
                GROUP BY IRNo
            ) IRA ON IRD.IRNo = IRA.IRNo
            LEFT JOIN testdb..IROtherSubjectName IRO ON IRD.IRNo = IRO.IRNo
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

const IRQA = async (IRNo, PrimaryDept, DeptCodeInv) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const insertQueryIRDetails = `
        INSERT INTO IRDeptInvolved (IRNo, PrimaryDept, DeptCodeInv)
        VALUES (@IRNo, @PrimaryDept, @DeptCodeInv);

        UPDATE testdb..IRDetailss
        SET RCA = '1',
            DateTimeRCAUpdated = GETDATE()
        WHERE IRNo = @IRNo;

        SELECT TOP 1
            i.IRNo,
            i.PrimaryDept,
            i.DeptCodeInv,	
			CASE
                WHEN irs.SubjectCode IS NULL THEN iro.SpecifiedCode
                ELSE irs.SubjectCode
            END AS SubjectCode,
            CASE
                WHEN irs.SubjectName IS NULL THEN iro.SpecifiedName
                ELSE irs.SubjectName
            END AS SubjectName,
            CASE
                WHEN u.UERMEmail IS NULL THEN iro.QAEmail
                ELSE u.UERMEmail
            END AS UERMEmail,
            e.UERMEmail AS transferEmail,
            d.SubjectNote,
            d.SubjectCause,
            d.SubjectResponse
        FROM
            testdb..IRDeptInvolved i
        LEFT JOIN
            testdb..IRDetailss d ON i.IRNo = d.IRNo
        LEFT JOIN
            testdb..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
        LEFT JOIN
            testdb..Users u ON CHARINDEX(irs.SubjectCode, u.SubjectCode) > 0
        LEFT JOIN 
            testdb..IRQATransfer irt ON i.IRNo = irt.IRNo
        LEFT JOIN 
            testdb..IRSubjectName irsn ON irt.SubjectCode = irsn.SubjectCode
        LEFT JOIN 
            [UE Database]..vw_Employees e ON irt.EmpTransfer = e.CODE
		LEFT JOIN 
			testdb..IROtherSubjectName iro ON i.IRNo = iro.IRNo
        WHERE i.IRNo = @IRNo;        
        `;
    
        request.input('IRNo', sql.NVarChar, IRNo);
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
        FROM testdb..Users
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
        FROM testdb..IRQATransfer IRQ
        LEFT JOIN testdb..IRSubjectName IRS ON IRQ.SubjectCode = IRS.SubjectCode
        LEFT JOIN [UE Database]..vw_Employees E1 ON IRS.EmployeeCode = E1.CODE
        LEFT JOIN testdb..IRQATransfer IRT ON IRQ.IRNo = IRT.IRNo
        LEFT JOIN testdb..IRSubjectName IRS1 ON IRT.SubjectCode = IRS1.SubjectCode
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
        
        const select = `SELECT UERMEmail FROM testdb..IREmail WHERE DeptCode = @DeptCode`;
        
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
        FROM testdb..DirectorUser
        WHERE DeptCode LIKE '%, ' + @DeptCode + ',%'
            OR DeptCode LIKE @DeptCode + ',%'
            OR DeptCode LIKE '%, ' + @DeptCode
            OR DeptCode = @DeptCode
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
            UPDATE IRDetailss
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

const approvedRCA = async (IRNo, ActionItem, TimelineFromDate, TimelineToDate) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('IRNo', sql.NVarChar, IRNo);
        request.input('ActionItem', sql.NVarChar, ActionItem);
        request.input('TimelineFromDate', sql.Date, TimelineFromDate);
        request.input('TimelineToDate', sql.Date, TimelineToDate);

        const insertQuery = `
        INSERT INTO IRActionItems (IRNo, ActionItem, TimelineFromDate, TimelineToDate, DateTimeCreated)
        VALUES (@IRNo, @ActionItem, @TimelineFromDate, @TimelineToDate, GETDATE());
        
        UPDATE IRDetailss
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
                    CASE
                        WHEN irs.SubjectName IS NULL THEN iro.SpecifiedName
                        ELSE irs.SubjectName
                    END AS SubjectName,
                ire1.FULLNAME AS PrimaryName,
                ire1.UERMEmail AS PrimaryEmail,
                    CASE
                        WHEN us.FULLNAME IS NULL THEN iro.QAName
                        ELSE us.FULLNAME
                    END AS QAName,
                    CASE
                        WHEN us.UERMEmail IS NULL THEN iro.QAEmail
                        ELSE us.UERMEmail
                    END AS QAEmail
            FROM 
                testdb..IRActionItems ira 
            LEFT JOIN testdb..IRDetailss d ON ira.IRNo = d.IRNo
            LEFT JOIN testdb..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
            LEFT JOIN testdb..IRDeptInvolved ird ON ira.IRNo = ird.IRNo
            LEFT JOIN testdb..IREmail ire1 ON ird.PrimaryDept = ire1.DeptCode
            LEFT JOIN testdb..Users us ON irs.EmployeeCode = us.EmployeeCode
            LEFT JOIN testdb..IROtherSubjectName iro ON ira.IRNo = iro.IRNo
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
        
        UPDATE IRDetailss
        SET RCA = '2'
        WHERE IRNo = @IRNo;
        
        SELECT TOP 1 
            irc.IRNo,
                CASE
                    WHEN irs.SubjectName IS NULL THEN iro.SpecifiedName
                    ELSE irs.SubjectName
                END AS SubjectName,
            irc.newConclusion,
            e.FULLNAME as PrimaryName,
            e.UERMEmail as PrimaryEmail,
                CASE
                    WHEN us.FULLNAME IS NULL THEN iro.QAName
                    ELSE us.FULLNAME
                END AS QAName,
                CASE
                    WHEN us.UERMEmail IS NULL THEN iro.QAEmail
                    ELSE us.UERMEmail
                END AS QAEmail
            
        FROM 
            testdb..IRConclusion irc
        LEFT JOIN
            testdb..IRDetailss d ON irc.IRNo = d.IRNo
        LEFT JOIN
            testdb..IRSubjectName irs ON d.SubjectCode = irs.SubjectCode
        LEFT JOIN 
            testdb..IRDeptInvolved ird ON irc.IRNo = ird.IRNo
        LEFT JOIN 
            testdb..IREmail e ON ird.PrimaryDept = e.DeptCode
		LEFT JOIN 
            testdb..Users us ON irs.EmployeeCode = us.EmployeeCode
        LEFT JOIN 
			testdb..IROtherSubjectName iro ON irc.IRNo = iro.IRNo
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
                    UPDATE IRDetailss
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
            SELECT * FROM testdb..IRActionItems
            WHERE IRNo = @IRNo;
        `;
        
        const result = await request.query(select);
        return result; // Return the recordset containing the new inserted data
    }catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const AcionItemStatus = async (Id, ActionStatus) => {
    try{
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        request.input('Id', sql.Int, Id);
        request.input('ActionStatus', sql.Int, ActionStatus);

        const updateActionItem = `
        UPDATE IRActionItems
        SET ActionStatus = @ActionStatus
        WHERE Id = @Id`;

        const result = await request.query(updateActionItem);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const getPendingRemarks = async (IRNo) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const DispendingRem = `
        SELECT *
        FROM testdb..IRPendingRemarks
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
                    UPDATE IRDetailss
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
            testdb..IRDetailss i
        LEFT JOIN testdb..IRDeptInvolved id ON i.IRNo = id.IRNo
        LEFT JOIN testdb..IRSubjectName irs ON i.SubjectCode = irs.SubjectCode 
        LEFT JOIN [UE Database]..vw_Employees ue ON irs.EmployeeCode = ue.CODE
        WHERE i.DateTimeRCAUpdated IS NULL;
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
            UPDATE IRDetailss
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
    getTime,
    getPendingRemarks,
    IRPendingRem,
    updateSendEmailCounts
    
}