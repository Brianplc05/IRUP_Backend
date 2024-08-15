import model from "../Models/ReportModel.js";

const FormDisCountSub = async (req, res) => {
    try{
        const result = await model.getNumberofSubject()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
};

const FormDisMatchDept = async (req, res) => {
    try{
        const result = await model.getMatchDepartment()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
};

const FormDisTotalAct = async (req, res) => {
    try{
        const result = await model.getTotalActionItem()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
};

export {
    FormDisCountSub,
    FormDisMatchDept,
    FormDisTotalAct
}