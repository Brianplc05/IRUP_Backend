import model from "../Models/DirectorModel.js";

const DirectorFormDisAll = async (req, res) => {
    try {
        const code = req.user.EmployeeCode;
        if (!code) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await model.getAllDirector(code);
        
        if (result.recordset.length === 0) {
            const headResult = await model.getAllHead(code);
            
            if (headResult.recordset.length === 0) {
                const superAuditResult = await model.getSuperAuditDT();
                return res.status(200).json(superAuditResult.recordset);
            }
        
            return res.status(200).json(headResult.recordset);
        }
        return res.status(200).json(result.recordset);
        
    } catch (error) {
        console.error('Error in DirectorFormDisAll:', error);
        return res.status(500).json({ msg: 'An error occurred while fetching director data.' });
    }
};


const FormDisDirectorIRF = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.getIREPORT(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);

    } catch (error) {
        console.error('Error inserting note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormDirectorRecommendation = async (req, res) => {
    try {
        
        const {IRNo, lostRec, FinancialLiability} = req.body;
        const code = req.user.EmployeeCode;
        if (!code) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await model.DirectorLostRec(IRNo, lostRec, FinancialLiability, code);
        if (result.rowsAffected === 0) {
            return res.status(403).json({ body: 'FAILED TO UPDATE STATUS' });
        }
        res.status(200).json({ body: 'SUCCESS UPDATE' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};


export {
    FormDirectorRecommendation,
    FormDisDirectorIRF,
    DirectorFormDisAll

}