import config from "../Configuration/config.js";
import sql from "mssql";
import model from "../Models/IRModels.js";
import util from "../Helpers/helper.js";


////IRFORM/////

const FormEmdept = async (req, res) => {
    try {
        const result = await model.getED();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const FormSubName = async (req, res) => {
    try {
        const result = await model.getSubName();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const FormSubCategory = async (req, res) => {
    try {
        const result = await model.getSubCategory();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const FormDivision = async (req, res) => {
    try {
        const result = await model.getDivision();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching Division:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const FormIncident = async (req, res) => {
    try {
        const {
            EmployeeCode,
            DeptCode,
            DivisionCode,
            SubjectBriefDes,
            SubjectCode,
            SubjectDate,
            SubjectTime,
            SubjectLoc = '',  // Default to empty string if undefined
            SubjectNote = '', // Default to empty string if undefined
            SubjectCause,
            SubjectResponse
        } = req.body;

        // Assuming model.IncidentReport is correct
        const result = await model.IncidentReport(
            EmployeeCode, 
            DeptCode, 
            SubjectCode, 
            DivisionCode, 
            SubjectBriefDes, 
            SubjectDate, 
            SubjectTime, 
            SubjectLoc.toUpperCase(), 
            SubjectNote.trim(), 
            SubjectCause, 
            SubjectResponse
        );

        // Accessing the first record in the recordset array
       

        const records = result.recordset;
        console.log(records)
        for (const record of records) {
            const { IRNo, FULLNAME, SubjectName, UERMEmail, FULLNAME1, UERMEmail1, Division, SubjectBriefDes } = record;

            if (record.SubjectCode === 'others') {
                await OtherSubjectCode(IRNo, FULLNAME, UERMEmail, Division, SubjectBriefDes);
                console.log('Email sent to the QA');
                await OtherSubjectCode1(IRNo, FULLNAME1, UERMEmail1, Division, SubjectBriefDes);
                console.log('Email sent to the QAAssistant');
            } else {
                await UniqueSubjectCode(IRNo, FULLNAME, UERMEmail, SubjectName);
                console.log('Email sent to the QA OFFICER');
            }
        }

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error creating incident report:', error);
        return res.status(500).json({ message: 'ERROR CREATING INCIDENT REPORT' });
    }

    async function OtherSubjectCode(IRNo, FULLNAME, UERMEmail, Division, SubjectBriefDes) {
        if (UERMEmail) {
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS<br />`,
                content: `Good day! <br> 
                        I hope everything is going smoothly for you. 
                        I wanted to bring to your attention the following incident report for your review.
                        <br> 
                        <br> 
                        <b>Incident Report Details:</b>
                        <br> 
                        Incident Report Number: <b>${IRNo}.</b> 
                        <br> 
                        We have received an incident report regarding your division: <b>${Division}</b>
                        <br>
                        This is a brief description of the incident: <b>${SubjectBriefDes}</b>
                        <br>
                        <br>
                        Please review the incident details and address the concerns accordingly.
                        <br>
                        Thank you for your prompt attention to this matter.
                        <br>
                        QA Name: <b>${FULLNAME}.</b><br/>
                        QA Email: <b>${UERMEmail}.</b>`,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }
    }

    async function OtherSubjectCode1(IRNo, FULLNAME1, UERMEmail1, Division, SubjectBriefDes) {
        if (UERMEmail1) {
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS<br />`,
                content: `Good day! <br> 
                        I hope everything is going smoothly for you. 
                        I wanted to bring to your attention the following incident report for your review.
                        <br> 
                        <br> 
                        <b>Incident Report Details:</b>
                        <br> 
                        Incident Report Number: <b>${IRNo}.</b> 
                        <br> 
                        We have received an incident report regarding your division: <b>${Division}</b>
                        <br>
                        This is a brief description of the incident: <b>${SubjectBriefDes}</b>
                        <br>
                        <br>
                        Please review the incident details and address the concerns accordingly.
                        <br>
                        Thank you for your prompt attention to this matter.
                        <br>
                        QA Assistant Name: <b>${FULLNAME1}.</b><br/>
                        QA Assistant Email: <b>${UERMEmail1}.</b>`,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }
    }

    async function UniqueSubjectCode(IRNo, FULLNAME, UERMEmail, SubjectName) {
        if (UERMEmail) {
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS <br />`,
                content: `Good day! <br> 
                        I hope everything is going smoothly for you. 
                        I wanted to bring to your attention the following incident report for your review.
                        <br> 
                        <br> 
                        <b>Incident Report Details:</b>
                        <br> 
                        Incident Report Number: <b>${IRNo}.</b> 
                        <br> 
                        We have received an incident report regarding:  <b>${SubjectName}</b><br>
                        <br>
                        Please review the incident details and address the concerns accordingly.
                        <br>
                        Thank you for your prompt attention to this matter.
                        <br>
                        QA Name: <b>${FULLNAME}.</b><br/>
                        QA Email: <b>${UERMEmail}.</b>`,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }
    }
};

const FormDepDis = async (req, res) => {
    try {
      // Validate the request (e.g., check if user is authenticated)
    //   if (!req.user) {
    //     return res.status(401).json({ message: "Unauthorized" });
    //   }

      // Fetch department data from the model
    const result = await model.getIRDept();

      // Return the department data
    return res.status(200).json(result.recordset);
    } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
    }
};

////////////////////////////////////////

////HRDEMERIT/////

const FormDepTab = async (req, res) => {
    try{
        const result = await model.getDept()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormEmploDet = async (req, res) => {
    try{
        const result = await model.getEmploDetails()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormEmployee = async (req, res) => {
    try {
        const IRNo = req.body.iRNo;
        const EmployeeCode = req.body.EmployeeCode;
        const DisciplineCode = req.body.DisciplineCode;
        const SpecificOfNo = req.body.SpecificOfNo;
        const Penalties = req.body.Penalties;
        const Occurrence = req.body.Occurrence;

        let insertCount = 0;
        for (let EmployeeCodes of EmployeeCode) {
            const result = await model.getEmployee(IRNo, EmployeeCodes, DisciplineCode, SpecificOfNo, Penalties, Occurrence);
            if (result.rowsAffected > 0) {
                insertCount++;
            }
        }

        if (insertCount === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }
        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}


// const FormDeptment = async (req, res) => {
//     try{
//         const IRNo = req.body.iRNo;
//         const DeptCode = req.body.DeptCode;
//         const demerits = req.body.demerits;
//         const result = await model.getDepartment(IRNo, DeptCode, demerits);
//         if (result.rowsAffected === 0) {
//             return res.status(403).json({ message: 'Failed to create new note' });
//         }
//         return res.status(200).json({ message: 'Success: new note created' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error updating status' });
//     }
// }

const FormCBDis = async (req, res) => {
        try {
        const result = await model.getIRCD();
        return res.status(200).json(result.recordset);
        } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        }
    };

const FormSpeOfDis = async (req, res) => {
        try {
        const result = await model.getIRSpeO();
        return res.status(200).json(result.recordset);
        } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        }
    };
    
////////////////////////////////////////


export { 
    FormSubName,
    FormEmdept,
    FormIncident,
    FormSubCategory,
    FormDivision,
    FormDepDis,
    FormEmploDet,
    FormEmployee,
    // FormDeptment,
    FormDepTab,
    FormCBDis,
    FormSpeOfDis
};
