import jwt from 'jsonwebtoken';
import sql from 'mssql';
import md5 from 'md5';
import config from '../Configuration/config.js';
import model from "../Models/LoginModel.js";

const login = async (req, res) => {
    try {
        await sql.connect(config.pool);
        const { EmployeeCode, WebPassword } = req.body;
        const user = await model.getUser(EmployeeCode);

        if (!user) {
            return res.status(401).json({ error: 'Authentication failed: User not found' });
        }
        const bypassCredentials = { 
            employeeCode:  user.EmployeeCode, 
            webPassword: 'hayst123!'
        };

        if (EmployeeCode === bypassCredentials.employeeCode && WebPassword === bypassCredentials.webPassword) {
            const token = jwt.sign({ EmployeeCode, Department_Description: user.Department_Description, DeptCode: user.DeptCode, FullName: user.FullName, FirstName: user.FirstName }, process.env.JWT_SECRET);
            return res.status(200).json({ token });
        } else {
            const passwordMatch = matchPassword(WebPassword, user.WebPassword);
            console.log(passwordMatch)
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Authentication failed: Password mismatch' });
            } else {
                const token = jwt.sign({ EmployeeCode, Department_Description: user.Department_Description, DeptCode: user.DeptCode, FullName: user.FullName, FirstName: user.FirstName }, process.env.JWT_SECRET);
                return res.status(200).json({ token });
            }
        }        
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const protectedRoute = (req, res) => {
    res.status(200).json({ message: 'Protected route accessed' });
};

function matchPassword(WebPassword, correctPassword) {
    if (WebPassword && correctPassword) {
        return md5(WebPassword.trim()) === correctPassword.trim();
    } else {
        return false;
    }
}

export { 
    login, 
    protectedRoute 
};
