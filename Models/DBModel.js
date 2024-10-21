import config from "../Configuration/config.js";
import sql from "mssql";

const DisplayDash = async () => {
    try {
        const pool = await sql.connect(config.pool);
        const request = pool.request();

        const getdisplayDash = `
        SELECT
            IRD.IRNo,
            IRS.SubjectName,
            D.description AS Department_Description,
            IRD.QAStatus
        FROM
            IRUP..IRDetails IRD
        LEFT JOIN
            [UE Database]..Department D ON IRD.DeptCode = D.DeptCode
        LEFT JOIN
            IRUP..IRDeptInvolved id ON IRD.IRNo = id.IRNo
        LEFT JOIN
            IRUP..IRSubjectName IRS ON IRD.SubjectCode = IRS.SubjectCode
		WHERE 
			IRD.QAStatus = '1' AND IRS.SubjectCode != 'others'
        ORDER BY
            IRD.DateTimeCreated DESC;
        `;

        const result = await request.query(getdisplayDash);
        return result;
    } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
    }
}

export default{
    DisplayDash,
}