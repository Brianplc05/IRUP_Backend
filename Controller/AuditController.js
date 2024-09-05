import model from "../Models/AuditModule.js";
import util from "../Helpers/helper.js";

const FormTab = async (req, res) => {
    try{
        const result = await model.getTab()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormSubjectTab = async (req, res) => {
    try{
        const result = await model.getIncident()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormSubjectNote = async (req, res) => {
    try {
        const { SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA } = req.body;
        // Convert SubjectPolicy to a string if it is an array
        const subjectPolicyString = Array.isArray(SubjectPolicy) ? SubjectPolicy.join(', ') : SubjectPolicy;

        const result = await model.SubjectDetails(
            SubjectName,
            subjectPolicyString,
            SubjectRiskCode.trim(),
            EmployeeCode,
            SecondaryQA
        );

        console.log('Result from model.SubjectDetails:', result);

        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }

        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error('Error creating incident report:', error);
        res.status(500).json({ message: 'ERROR CREATING INCIDENT REPORT' });
    }
}

const FormRiskTab = async (req, res) => {
    try{
        const result = await model.getRisk()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormDomainCode = async (req, res) => {
    try {
        const result = await model.getDomainCode();
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const FormRiskCode = async (req, res) => {
	try {
        const { DomainCode, RiskDomain, Risk, RiskDescription } = req.body;
    
        const result = await model.RiskDic(
            DomainCode.toUpperCase(), RiskDomain.trim(), Risk, RiskDescription
        )

        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create RiskCode' });
        }

        return res.status(200).json({ message: 'Success: new RiskCode' });
    } catch (error) {
        console.error('Error creating risk dictionary:', error);
        res.status(500).json({ message: 'ERROR CREATING RISK DICTIONARY' });
    }
}

const FormAudit = async (req, res) => {
    try {
        const iRNo = req.body.iRNo;
        const note = req.body.note;
        const policyCode = req.body.policyCode;
        const result = await model.IRAudit(note, iRNo, policyCode);
        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }
        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormNote = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.getNote(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error inserting note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormdelNote = async (req, res) => {
    try {
        const Id = req.body.Id;
        if (!Id) {
            return res.status(400).json({ message: 'Id is required' }); // Check if Id is missing
        }
        const result = await model.updNote(Id);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormEdNote = async (req, res) => {
    try{
        const Id = req.body.Id;
        const newNote = req.body.newNote;
        const result = await model.editNote(Id, newNote);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormAuditSta = async (req, res) => {
    try {
        const AuditStatus = req.body.AuditStatus;
        const iRNo = req.body.IRNo;
        const result = await model.AuditStatus(AuditStatus, iRNo)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}


export {
    FormTab,
    FormSubjectTab,
    FormSubjectNote,
    FormRiskTab,
    FormDomainCode,
    FormRiskCode,
    FormAudit,
    FormNote,
    FormdelNote,
    FormEdNote,
    FormAuditSta


}