import config from "../Configuration/config.js";
import sql from "mssql";
import { OAuth2Client } from 'google-auth-library';

const getIRUser = async (UERMEmail) => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();
        
        request.input('UERMEmail', sql.VarChar, UERMEmail);

        const query = `SELECT 
                            E.DeptCode,
                            E.EmployeeCode,
                            E.FirstName,
                            CONCAT(LastName, ', ', FirstName, ' ', CASE WHEN MiddleName IS NOT NULL THEN LEFT(MiddleName, 1) + '.' ELSE '' END) AS FullName,
							E.UERMEmail
                        FROM 
                            [UE database]..Employee E
                        WHERE 
                            E.UERMEmail = @UERMEmail;`;

        const result = await request.query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

const verifyGoogleIdToken = async (idToken) => {
    const client = new OAuth2Client(process.env.CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.CLIENT_ID
        });

        const payload = ticket.getPayload();
        return payload.email;
    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        throw error;
    }
}

export default {
    getIRUser,
    verifyGoogleIdToken
};
