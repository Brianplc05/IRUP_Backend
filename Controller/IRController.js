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

const FormIncident = async (req, res) => {
    try {
        const {
            EmployeeCode,
            DeptCode,
            OtherSubject,
            SubjectCode,
            SubjectDate,
            SubjectTime,
            SubjectLoc = '',  // Default to empty string if undefined
            SubjectNote = '', // Default to empty string if undefined
            SubjectCause,
            SubjectResponse
        } = req.body;

        let result;
        let email; // Define email variable

        if (!SubjectCode || SubjectCode.length === 0) {
            result = await model.IncidentReport(EmployeeCode, DeptCode, SubjectCode, SubjectDate, SubjectTime, SubjectLoc.trim(), SubjectNote.trim(), SubjectCause, SubjectResponse);
            const IRNo = result.recordset[0].IRNo;
            console.log('Generated IRNo:', IRNo);

            if (OtherSubject) {
                result = await model.OtherSubjectIncident(IRNo, OtherSubject);
                const { IRNo: updatedIRNo, SpecifiedName: SubjectName, QAName: QAName } = result.recordset[0];
                email = result.recordset[0].QAEmail; // Set email here
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
                            Incident Report Number:<b>${updatedIRNo}.</b> 
                            <br> 
                            We have received an incident report regarding:  <b>${SubjectName}</b><br>
                            <br>
                            Please review the incident details and address the concerns accordingly.
                            <br>
                            Thank you for your prompt attention to this matter.
                            <br>
                            QA Name: <b>${QAName}.</b><br/>
                            QA Email: <b>${email}.</b>`,
                    email,
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }
        } else {
            result = await model.IncidentReport(EmployeeCode, DeptCode, SubjectCode, SubjectDate, SubjectTime, SubjectLoc.trim(), SubjectNote.trim(), SubjectCause, SubjectResponse);
            const { SubjectCode: qaContents } = result.recordset[0];
            const QaEmail = await model.getQAEmail(qaContents);

            if (QaEmail && QaEmail.length > 0) {
                email = QaEmail[0].UERMEmail; // Set email here
                const { IRNo, SubjectName } = result.recordset[0];

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
                            Incident Report Number:<b>${IRNo}.</b> 
                            <br> 
                            We have received an incident report regarding:  <b>${SubjectName}</b><br>
                            <br>
                            Please review the incident details and address the concerns accordingly.
                            <br>
                            Thank you for your prompt attention to this matter.
                            <br>
                            QA Email: <b>${email}.</b>`,
                    email,
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }
        }

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error creating incident report:', error);
        res.status(500).json({ message: 'ERROR CREATING INCIDENT REPORT' });
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

////////////AUDIT////////////////////
const FormTab = async (req, res) => {
    try{
        const result = await model.getTab()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormSubjectTab = async (req, res) => {
    try{
        const result = await model.getIncident()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormSubjectNote = async (req, res) => {
    try {
        const { SubjectName, SubjectPolicy, SubjectRiskCode, EmployeeCode, SecondaryQA } = req.body;

        console.log('Request body:', req.body);

        // Convert SubjectPolicy to a string if it is an array
        const subjectPolicyString = Array.isArray(SubjectPolicy) ? SubjectPolicy.join(', ') : SubjectPolicy;

        const result = await model.SubjectDetails(
            SubjectName,
            subjectPolicyString,
            SubjectRiskCode.trim(),
            EmployeeCode,
            SecondaryQA
        );

        console.log('Result from model.SubjectDetails:', result);

        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }

        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error('Error creating incident report:', error);
        res.status(500).json({ message: 'ERROR CREATING INCIDENT REPORT' });
    }
}

const FormRiskTab = async (req, res) => {
    try{
        const result = await model.getRisk()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormRiskCode = async (req, res) => {
	try {
        const { DomainCode, RiskDomain, Risk, RiskDescription } = req.body;

        const result = await model.RiskDic(
            DomainCode, RiskDomain, Risk, RiskDescription
        )

        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create RiskCode' });
        }

        return res.status(200).json({ message: 'Success: new RiskCode' });
    } catch (error) {
        console.error('Error creating risk dictionary:', error);
        res.status(500).json({ message: 'ERROR CREATING RISK DICTIONARY' });
    }
}



const FormAudit = async (req, res) => {
    try {
        const iRNo = req.body.iRNo;
        const note = req.body.note;
        const policyCode = req.body.policyCode;
        const result = await model.IRAudit(note, iRNo, policyCode);
        if (result.rowsAffected === 0) {
            return res.status(403).json({ message: 'Failed to create new note' });
        }
        return res.status(200).json({ message: 'Success: new note created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormNote = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.getNote(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error inserting note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormdelNote = async (req, res) => {
    try {
        const Id = req.body.Id;
        if (!Id) {
            return res.status(400).json({ message: 'Id is required' }); // Check if Id is missing
        }
        const result = await model.updNote(Id);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormEdNote = async (req, res) => {
    try{
        const Id = req.body.Id;
        const newNote = req.body.newNote;
        const result = await model.editNote(Id, newNote);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormAuditSta = async (req, res) => {
    try {
        const AuditStatus = req.body.AuditStatus;
        const iRNo = req.body.IRNo;
        const result = await model.AuditStatus(AuditStatus, iRNo)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

////////////////////////////////////////

export { 
    FormSubName,
    FormEmdept,
    FormIncident,
    FormSubjectTab,
    FormSubCategory,
    FormDepDis,
    FormEmploDet,
    FormEmployee,
    // FormDeptment,
    FormAudit,
    FormNote,
	FormTab,
    FormDepTab,
    FormdelNote,
    FormEdNote,
    FormCBDis,
    FormSpeOfDis,
    FormAuditSta,
    FormSubjectNote,
    FormRiskCode,
    FormRiskTab

};
