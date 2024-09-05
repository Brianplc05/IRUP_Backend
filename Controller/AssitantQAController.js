import model from "../Models/AssitantQAModel.js";
import util from "../Helpers/helper.js";

const FormAssistantQASub = async (req, res) => {
    try{
        const code = req.user.EmployeeCode;
        if (!code) {
                return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await model.getAllAssistantQA(code)
        return res.status(200).json(result.recordset);
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
};

const FormDisAQA = async (req, res) => {
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

const FormDisSubject = async (req, res) => {
    try{
        const result = await model.getSubjectName()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormDisDivision = async (req, res) => {
    try{
        const result = await model.getDivisionName()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormUpdateDivCode = async (req, res) => {
    try {
        const { IRNo, DivisionCode } = req.body.params;
        const result = await model.UpdateDivisionCode(IRNo, DivisionCode);
        const records = result.recordset;

        if( records && records.length > 0){
            const { IRNo, SubjectBriefDes, TransferQAName, TransferQAEmail, TransferQAAName, TransferQAAEmail} = records[0];
            if(TransferQAName){
                const emailContent = {
                    subject: "INCIDENT REPORT",
                    header: `INCIDENT REPORT DETAILS<br />`,
                    content: `Good day!<br>
                            Mr./Ms. <b>${TransferQAName}</b>,<br>
                            <b>${TransferQAEmail}</b><br>
                            I wanted to inform you about an incident report that requires your attention. 
                            Based on the details of the incident, it appears that your department is responsible for addressing this issue.<br><br>
                            
                            <b>Incident Report Details:</b>${IRNo}<br>
                            This is a brief description of the incident: <b>${SubjectBriefDes}</b>
                            <br><br>
                        
                            Thank you for your prompt attention to this matter.<br>
                            `,
                    email: 'jppalacio@uerm.edu.ph',
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }

            if(TransferQAAName){
                const emailContent = {
                    subject: "INCIDENT REPORT",
                    header: `INCIDENT REPORT DETAILS<br />`,
                    content: `Good day!<br>
                            Mr./Ms. <b>${TransferQAAName}</b>,<br>
                            <b>${TransferQAAEmail}</b><br>
                            I wanted to inform you about an incident report that requires your attention. 
                            Based on the details of the incident, it appears that your department is responsible for addressing this issue.<br><br>
                            
                            <b>Incident Report Details:</b>${IRNo}<br>
                            This is a brief description of the incident: <b>${SubjectBriefDes}</b>
                            <br><br>
                        
                            Thank you for your prompt attention to this matter.<br>
                            `,
                    email: 'jppalacio@uerm.edu.ph',
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }
        } else {
            res.status(404).json({ message: 'No records found to update or send email.' });
            return;
        }
        res.status(200).json({ message: 'SUCCESSFUL UPDATE OF DIVISION CODE' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'ERROR UPDATING DIVISION CODE' });
    }
}

const FormUpdateSubCode = async (req, res) => {
    try {
        const EmUpdSubCode = req.user.EmployeeCode;
        if (!EmUpdSubCode) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { IRNo, SubjectCode } = req.body.params;
        console.log(req.body)
        const result = await model.UpdateSubjectCode(IRNo, SubjectCode, EmUpdSubCode);

        const records = result.recordset;
        if (records && records.length > 0) {
            const { IRNo, SubjectName, QANAME, TransferName, QAEMAIL, TransferEmail } = records[0]; 
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS<br />`,
                content: `Good day!<br>
                        Mr./Ms. <b>${QANAME}</b>,<br>
                        <b>${QAEMAIL}</b><br>
                        I hope everything is going smoothly for you. I wanted to bring to your attention the following incident report for your review.<br><br>
                        
                        <b>Incident Report Details:</b><br>
                        Incident Report Number: <b>${IRNo}</b><br>
                        We have received an incident report regarding: <b>${SubjectName}</b><br><br>
                        
                        Please review the incident details and address the concerns accordingly. If you have any further questions, don't hesitate to notify me:<br>
                        Name: <b>${TransferName}</b><br/>
                        Email: <b>${TransferEmail}</b><br/><br/>
                        Thank you for your prompt attention to this matter.<br>
                        `,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        } else {
            res.status(404).json({ message: 'No records found to update or send email.' });
            return;
        }
        res.status(200).json({ message: 'SUCCESSFUL UPDATE OF SUBJECT CODE' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'ERROR UPDATING SUBJECT CODE' });
    }
};



export {
    FormAssistantQASub,
    FormDisAQA,
    FormUpdateSubCode,
    FormDisSubject,
    FormUpdateDivCode,
    FormDisDivision
}