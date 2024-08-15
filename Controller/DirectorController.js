import model from "../Models/DirectorModel.js";

const DirectorFormDisAll = async (req, res) => {
    const code = req.user.EmployeeCode;
    const deptCode = await model.allDeptCode(code);
    const deptCodesArray = deptCode[0].DeptCode.split(',');
    try {
        const result = await model.getAllDirector();
        const filteredResults = result.filter(item => deptCodesArray.includes(item.PrimaryDept));
        return res.status(200).json(filteredResults);
    } catch (error) {
        console.error('Error in DirectorFormDisAll:', error);
        return res.status(500).json({ msg: 'An error occurred while fetching director data.' });
    }
}

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
        const IRNo = req.body.IRNo;
        const lostRec = req.body.lostRec;
        const FinancialLiability = req.body.FinancialLiability;

        const result = await model.DirectorLostRec(IRNo, lostRec, FinancialLiability);

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