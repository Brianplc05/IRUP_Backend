import jwt from 'jsonwebtoken';
import model from "../Models/AGModel.js";

const GoogleLogin = async (req, res) => {
    try {
        const UERMEmail = req.body.UERMEmail;
        const googleuser = await model.getgoogleUser(UERMEmail);

        if (!googleuser) {
            return res.status(401).json({ error: 'Authentication failed: User not found' });
        }
        const token = jwt.sign(
            { EmployeeCode: googleuser.EmployeeCode, DeptCode: googleuser.DeptCode, 
                FirstName: googleuser.FirstName, FullName: googleuser.FullName, 
                Department_Description: googleuser.Department_Description, UERMEmail: googleuser.UERMEmail},
            process.env.JWT_SECRET
        );
        return res.status(200).json({ token });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export { 
    GoogleLogin 
};
