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
            SubjectLoc.toUpperCase().trim(), 
            SubjectNote.trim(), 
            SubjectCause, 
            SubjectResponse
        );

        // Accessing the first record in the recordset array

        const records = result.recordset;
        console.log(records)
        for (const record of records) {
            const { IRNo, FULLNAME, SubjectName, Description, UERMEmail, FULLNAME1, UERMEmail1,SubjectBriefDes, SubjectDate, SubjectTime, SubjectLoc, RiskDescription } = record;

            if (record.SubjectCode === 'others') {
                await OtherSubjectCode(IRNo, FULLNAME, UERMEmail, Description, SubjectBriefDes);
                console.log('Email sent to the QA');
                await OtherSubjectCode1(IRNo, FULLNAME1, UERMEmail1, Description, SubjectBriefDes);
                console.log('Email sent to the QAAssistant');
            } else {
                await UniqueSubjectCode(IRNo, FULLNAME, UERMEmail, SubjectName, SubjectDate, SubjectTime, RiskDescription, SubjectLoc);
                console.log('Email sent to the QA OFFICER');
            }
        }

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error creating incident report:', error);
        return res.status(500).json({ message: 'ERROR CREATING INCIDENT REPORT' });
    }

    async function OtherSubjectCode(IRNo, FULLNAME, UERMEmail, Description, SubjectBriefDes) {
        if (UERMEmail) {
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS<br />`,
                content: `Good Day!<br>
                            Dear <b>${FULLNAME},</b><br><br>
                            We are reaching out to request a review and reclassification of an incident report 
                            currently tagged under the "Others" category in the IR system. 
                            Below are the details of the incident:
                            <br><br> 
                            <b>Incident Report Details:</b>
                            <br> 
                            <b>Incident Report Number:</b> ${IRNo}.
                            <br>
                            <b>Incident Responder (Department):</b> ${Description}
                            <br> 
                            <b>Brief Description of the incident:</b> ${SubjectBriefDes}
                            <br><br>
                            Your prompt assistance in ensuring proper documentation and handling, 
                            we kindly request your team’s assistance in reviewing the incident report 
                            and determining the appropriate category.
                            <br><br>
                            Thank you for your prompt attention to this matter.
                            <br>
                            QA Email: <b>${UERMEmail}.</b>`,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }
    }

    async function OtherSubjectCode1(IRNo, FULLNAME1, UERMEmail1,  Description, SubjectBriefDes) {
        if (UERMEmail1) {
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS<br />`,
                content: `Good Day!<br>
                            Dear <b>${FULLNAME1},</b><br><br>
                            We are reaching out to request a review and reclassification of an incident report 
                            currently tagged under the "Others" category in the IR system. 
                            Below are the details of the incident:
                            <br> 
                            <br> 
                            <b>Incident Report Details:</b>
                            <br> 
                            <b>Incident Report Number:</b> ${IRNo}.
                            <br>
                            <b>Incident Responder (Department):</b> ${Description}
                            <br> 
                            <b>Brief Description of the incident:</b> ${SubjectBriefDes}
                            <br>
                            <br>
                            Your prompt assistance in ensuring proper documentation and handling, 
                            we kindly request your team’s assistance in reviewing the incident report 
                            and determining the appropriate category.
                            <br>
                            <br>
                            Thank you for your prompt attention to this matter.
                            <br>
                            QA Email: <b>${UERMEmail1}.</b>`,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }
    }

    async function UniqueSubjectCode(IRNo, FULLNAME, UERMEmail, SubjectName, SubjectDate, SubjectTime, RiskDescription, SubjectLoc) {
        if (UERMEmail) {
            const formattedDate = new Date(SubjectDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }).toUpperCase();
    
            const formattedTime = new Date(SubjectTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase();
    
            const emailContent = {
                subject: "INCIDENT REPORT",
                header: `INCIDENT REPORT DETAILS <br />`,
                content: `Good Day!<br>
                            Dear <b>${FULLNAME},</b><br><br>
    
                            I would like to bring to your attention the reported incident in the system. 
                            Please find the details of the incident below for your review and necessary action:
                            <br> 
                            <br> 
                            <b>Incident Report Details:</b>
                            <br> 
                            <b>Incident Report Number:</b> ${IRNo}.
                            <br>
                            <b>Subject of the Incident:</b> ${SubjectName}
                            <br> 
                            <b>Brief Description of the incident:</b> ${RiskDescription}
                            <br>
                            <b>Date and Time:</b> ${formattedDate} & ${formattedTime}
                            <br>
                            <b>Location of the incident:</b> ${SubjectLoc}
                            <br>
                            <br>
                            Kindly review the incident and address the concerns accordingly.
                            <br>
                            <br>
                            Thank you for your prompt attention to this matter.
                            <br>
                        
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
