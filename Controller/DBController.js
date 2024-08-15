import model from "../Models/DBModel.js";

const DisAllDashboard = async (req, res) => {
    try{
        const result = await model.DisplayDash()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

export {
    DisAllDashboard,
}