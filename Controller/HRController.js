import model from "../Models/HRModel.js";

const FormDisAll = async (req, res) => {
    try{
        const result = await model.getAll()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
};

const FormHRSta = async (req, res) => {
    try {
        const HRStatus = req.body.HRStatus;
        const iRNo = req.body.IRNo;
        const result = await model.HRStatus(HRStatus, iRNo)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormDisHRIRF = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.getHRIREPORT(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);

    } catch (error) {
        console.error('Error inserting note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormHRAct = async (req, res) => {
    try {
        const HRDicipAction = req.body.HRDicipAction;
        const iRNo = req.body.IRNo;
        const result = await model.HRAction(HRDicipAction, iRNo)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormHRN = async (req, res) => {
    try {
        const EmployeeCode = req.user.EmployeeCode;
        if (!EmployeeCode) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const IRNo = req.body.iRNo;
        const newHRNote = req.body.newHRNote;
        const result = await model.HRNote(newHRNote, IRNo, EmployeeCode);
        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }
        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormHRNotes = async (req, res) => {
    try {
        const EmployeeCode = req.user.EmployeeCode;
        if (!EmployeeCode) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const IRNo = req.body.iRNo;
        const newHRNote = req.body.newHRNote;
        const result = await model.HRNotes(newHRNote, IRNo, EmployeeCode);
        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }
        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormFinancialLiability = async (req, res) => {
    try {
        const EmployeeCode = req.user.EmployeeCode;
        if (!EmployeeCode) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const iRNo = req.body.IRNo;
        const FinancialLiability = req.body.FinancialLiability;
        const result = await model.HRFinLiability(iRNo, FinancialLiability, EmployeeCode);

        if (result.rowsAffected[0] === 0) {
            return res.status(403).json({ message: 'Failed to update FinancialLiability' });
        }
        return res.status(200).json({ message: 'Success: FinancialLiability Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

export {
    FormDisAll,
    FormHRSta,
    FormDisHRIRF,
    FormHRAct,
    FormHRN,
    FormHRNotes,
    FormFinancialLiability
}