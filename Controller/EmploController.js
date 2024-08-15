import model from "../Models/EmploModel.js";

const DisAllEmployee = async (req, res) => {
    try{
        const result = await model.DisplayEmplo()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormEmpTab = async (req, res) => {
    try {dy
        const IRNo = req.query.IRNo;
        const result = await model.DisDemerit(IRNo);
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error in FormEmpTab:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
};

export {
    DisAllEmployee,
    FormEmpTab
}