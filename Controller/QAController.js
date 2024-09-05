import model from "../Models/QAModel.js";
import util from "../Helpers/helper.js";

const QAFormDisAll = async (req, res) => {
    try{
        const EmployeeCode = req.user.EmployeeCode;
        if (!EmployeeCode) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await model.getAllQA(EmployeeCode)
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormDisIRF = async (req, res) => {
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

const FormQATransfer = async (req, res) => {
    try {
        const IRNo = req.body.IRNo;
        const SubjectCode = req.body.SubjectCode;
        const EmpTransfer = req.body.EmpTransfer.trim();
        const result = await model.putQATras(IRNo, SubjectCode, EmpTransfer);
        const record = result; // Directly use the first record
        

        if (record) {
            const IRNo = record.IRNo; 
            const SubjectName = record.SubjectName;
            const MainFullName = record.MainFullName;
            const MainEmail = record.MainEmail;
            const TransferFullName = record.TransferFullName;
            const TransEmail = record.TransEmail;

            if (TransEmail !== null) {
                const emailContent = {
                    subject: "TRANSFER INCIDENT REPORT",
                    header: `<div style="background-color: #FFC412; color: black; padding: 15px; height:20px">
                                TRANSFER INCIDENT REPORT
                            </div>`,
                    content: `Dear ${TransferFullName},<br />
                    I am writing to formally transfer the responsibility of the incident report referenced above to your department. Below are the details of the incident.
                    <br /><br />
                    <b>Incident Details:</b>
                    <br />
                    <b>• Incident Number:</b> ${IRNo} 
                    <br />
                    <b>• Subject of the Incident:</b> ${SubjectName} 
                    <br /><br />
                    For any questions or further clarification, please feel free to contact me at:
                    <br />
                    <b>• Quality Officer Name:<b>  ${MainFullName}
                    <br />
                    <b>• Quality Officer Email:<b>  ${MainEmail} 
                    <div style="background-color: #FFC412; height: 10px"/>`,
                    email: 'jppalacio@uerm.edu.ph',
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }
        }
        res.status(200).json({ message: 'QA Transfer updated and email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

const QAInsertEmail = async (req, res) => {
    try {
        const { IRNo, PrimaryDept, DeptCodeInv: DeptCodeInvArray } = req.body;
        const result = await model.IRQA(IRNo, PrimaryDept, DeptCodeInvArray);

        const primaryDepartment = result.recordset[0].PrimaryDept;
        const primaryEmail = await model.getEmail(primaryDepartment);

        if (primaryEmail && primaryEmail.length > 0) {
            const email = primaryEmail[0].UERMEmail;
            const { IRNo, UERMEmail, transferEmail, SubjectName, SubjectNote, SubjectCause, SubjectResponse } = result.recordset[0];
            
            const displayEmail = transferEmail && transferEmail.length > 0 ? transferEmail : UERMEmail;

            const emailContent = {
                subject: "INCIDENT REPORT",
                header: "INCIDENT REPORT DETAILS <br />",
                content: `Good day! <br /> 
                    I hope this email finds you well. As part of our ongoing commitment to maintaining the highest standards of quality and safety in our operations, 
                    I wanted to provide you with a comprehensive update regarding Incident Report No. <b>${IRNo}.</b> <br /> <br /> 
                    In response to the incident, please find the details below: <br/>
                    <b>• Subject of the Incident:</b> ${SubjectName}<br/><br />
                    <b>• Narrative description of the Incident:</b><br/>${SubjectNote}<br /> <br />
                    <b>• Possible Causes of the Incident:</b><br/>${SubjectCause}<br /> <br /> 
                    <b>• Immediate Response:</b><br/>${SubjectResponse}<br/><br />  
                    
                    You are required to submit a Root Cause Analysis (RCA) report to the Quality Assurance (QA) team. Attached is the PDF form of the RCA report for your reference.<br />
                    <a href="https://drive.google.com/file/d/1h-qTg1ulXM3poyTLJlIWWru_3KlAEjJm/view?usp=sharing">Download PDF</a> <br /> <br /> 
                    
                    Please liaise with this quality assurance representative for further assistance.<br /> 
                    <b>Quality Assurance Email:</b>${displayEmail} 
                    
                    <br><br>
                    • EMAIL: ${email} <br/>
                    `,
                email: 'jppalacio@uerm.edu.ph',
                name: 'JOHN BRIAN'
            };
            await util.sendEmail(emailContent);
        }

        if (primaryDepartment) {
            const directorEmail = await model.getDirectorEmail(primaryDepartment);

            if (directorEmail && directorEmail.length > 0) {
                const { UERMEmail: DirectorEmail, Fullname: DirectorName } = directorEmail[0];
                const { IRNo, SubjectName } = result.recordset[0];
                
                const emailContent = {
                    subject: "INCIDENT REPORT",
                    header: "INCIDENT REPORT UPDATE <br />",
                    content: `Dear ${DirectorName},<br/><br/>
                                <b>Director Email:</b>${DirectorEmail}<br/>
                                I hope this email finds you well. As part of our ongoing commitment to maintaining the highest standards of quality and safety in our operations, 
                                I wanted to provide you with a comprehensive update regarding Incident Report No. <b>${IRNo}.</b>Please check the Director Module for more information.<br /><br /> 
                                In response to the incident, please find the details below: <br/>
                                <b>• Subject of the Incident:</b> ${SubjectName}<br/><br/> `,
                    email: 'jppalacio@uerm.edu.ph',
                    name: 'JOHN BRIAN'
                };
                await util.sendEmail(emailContent);
            }
        }  

        if (result.recordset[0].DeptCodeInv) {
            const deptCodes = result.recordset[0].DeptCodeInv.split(',');
            const secondaryEmails = await Promise.all(deptCodes.map(dept => model.getEmail(dept)));

            for (const emails of secondaryEmails) {
                if (emails && emails.length > 0) {
                    const { IRNo, SubjectName, SubjectNote, SubjectCause, SubjectResponse } = result.recordset[0];
                    const { UERMEmail: primEmail } = primaryEmail[0];
                    const { UERMEmail: secondEmail } = emails[0];

                    const emailContent = {
                        subject: "INCIDENT REPORT",
                        header: "INCIDENT REPORT DETAILS <br />",
                        content: `Good day! <br /> <br />  
                            I hope this email finds you well. As part of our ongoing commitment to maintaining the highest standards of quality and safety in our operations, 
                            I wanted to provide you with a comprehensive update regarding Incident Report No. <b>${IRNo}.</b><br /> <br />
                            In response to the incident, please find the details below: <br/>
                            • EMAIL: ${secondEmail} <br/>
                            <b>• Subject of the Incident:</b> ${SubjectName}<br/><br />
                            <b>• Narrative description of the Incident:</b><br/>${SubjectNote}<br /> <br />
                            <b>• Possible Causes of the Incident:</b><br/>${SubjectCause}<br /> <br /> 
                            <b>• Immediate Response:</b><br/>${SubjectResponse}<br/><br />  
                            
                            <b>You are required to collaborate with Primary Department Involved to deliberate the Incident</b>
                            <br/><br/>
                            Here are the details below: <br/>
                            • <b>Primary Email of Department Involved:</b> ${primEmail} <br/>`,
                        email: 'jppalacio@uerm.edu.ph',
                        name: 'John Brian'
                    };
                    await util.sendEmail(emailContent);
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};



const QADisAll = async (req, res) => {
    try{
        const result = await model.getQAs()
        return res.status(200).json(result.recordset)
    }catch (error) {
        res.status(500).json({ msg: `Error` });
    }
}

const FormREConclusion = async (req, res) => {
    try {
        const IRNo = req.body.IRNo;
        const newConclusion = req.body.newConclusion;
        const result = await model.IRReCons(IRNo, newConclusion);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json({ message: 'Failed to update Conclusion' });
        }
        return res.status(200).json({ message: 'Success: Conclusion Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormApprovedRCA = async (req, res) => {
    try {
        const iRNo = req.body.IRNo;
        const ActionItem = req.body.ActionItem;  // Assuming this is an array
        const TimelineFromDate = req.body.TimelineFromDate;  // Assuming this is an array
        const TimelineToDate = req.body.TimelineToDate;  // Assuming this is an array

        for (let i = 0; i < ActionItem.length; i++) {
            await model.approvedRCA(iRNo, ActionItem[i], TimelineFromDate[i], TimelineToDate[i]);
        }

        const result = await model.selectApprovedRCA(iRNo);
        if (result.recordset && result.recordset.length > 0) {
            const combinedResult = buildCombinedResult(result.recordset);

            const {
                IRNo,
                SubjectName,
                PrimaryName,
                PrimaryEmail,
                QAName,
                QAEmail
            } = combinedResult;

            const actionItems = Object.keys(combinedResult)
                .filter(key => key.startsWith('ActionItem'))
                .map(key => combinedResult[key]);

            if (PrimaryEmail) {
                await ActionitemEmail(IRNo, SubjectName, PrimaryName, PrimaryEmail, QAName, QAEmail, actionItems);
            }

            res.status(200).json({ message: 'Success: action items created' });
        } else {
            res.status(200).json({ message: 'No action items found' });
        }
    } catch (error) {
        console.error('Error in FormApprovedRCA:', error);
        res.status(500).json({ message: 'Error updating action items' });
    }
};

const buildCombinedResult = (recordset) => {
    const combinedResult = {
        IRNo: recordset[0].IRNo,
        SubjectName: recordset[0].SubjectName,
        PrimaryName: recordset[0].PrimaryName,
        PrimaryEmail: recordset[0].PrimaryEmail,
        QAName: recordset[0].QAName,
        QAEmail: recordset[0].QAEmail
    };

    recordset.forEach((item, index) => {
        combinedResult[`ActionItem${index + 1}`] = item.ActionItem;
    });

    return combinedResult;
};

async function ActionitemEmail(IRNo, SubjectName, PrimaryName, PrimaryEmail, QAName, QAEmail, ActionItems) {
    if (PrimaryEmail) {
        const emailContent = {
            subject: "IMPLEMENTIVE ACTION OF THE INCIDENT REPORT",
            header: "CORRECTIVE/ PREVENTIVE ACTION OF THE INCIDENT REPORT<br />",
            content: `Dear ${PrimaryName},<br/><br/>
            <b>Email: ${PrimaryEmail}</b><br/><br/>
            We are writing to inform you about the necessary corrective and preventive actions required following the recent incident report for the <b>${SubjectName}</b>. It is imperative that these actions are undertaken promptly to address the identified issues and prevent future occurrences. Please review the details below: <br><br>
            <b>• Incident Report Number:</b> ${IRNo}<br/><br />

            <b>Action Details:</b><br />
            ${ActionItems.map((action, index) => `<b>• Action Item ${index + 1}:</b> ${action}<br/>`).join('')}
            <br>
            For any questions or further clarification, please feel free to contact me at:
            <br>
            <b>• Quality Officer Name:</b> ${QAName}<br>
            <b>• Quality Officer Email:</b> ${QAEmail}
            `,
            email: 'jppalacio@uerm.edu.ph',
            name: 'JOHN BRIAN'
        };
        await util.sendEmail(emailContent);
    }
}


const FormDisApprovedRCA = async (req, res) => {
    try {
        const iRNo = req.body.IRNo;
        const newConclusion = req.body.newConclusion;
        const result = await model.disapprovedRCA(iRNo, newConclusion);
        const record = result.recordset[0];
        if (record) {
            const IRNo = record.IRNo; 
            const SubjectName = record.SubjectName;
            const newConclusion = record.newConclusion;
            const PrimaryName = record.PrimaryName;
            const PrimaryEmail = record.PrimaryEmail;
            const QAName = record.QAName;
            const QAEmail = record.QAEmail;

            if (PrimaryEmail !== null) {
                const emailContent = {
                    subject: 'DISAPPROVED RCA',
                    header: `<div style="background-color: red; color: white; padding: 15px; height:20px">
                                DISAPPROVED ROOT CAUSE ANALYSIS (RCA)
                            </div>`,
                    content: `Dear ${PrimaryName},<br />
                        <b> Email: ${PrimaryEmail} </b><br/><br/>
                        I am writing to formally address that the RCA you've submitted is disapproved. The required data and elements in the RCA did not meet acquired details. Check the details below:
                    <br><br>
                    <b>Incident Details:</b>
                    <br>
                    <b>• Incident Number:</b> ${IRNo} 
                    <br>
                    <b>• Subject of the Incident:</b>${SubjectName}
                    <br>
                    <b>• Quality Officer Remarks:</b> ${newConclusion} 
                    <br><br>
                    You are required to submit again the Root Cause Analysis (RCA) report to the Quality Assurance (QA) team. Attached is the PDF form of the RCA report for your reference.<br />
                    <a href="https://drive.google.com/file/d/1h-qTg1ulXM3poyTLJlIWWru_3KlAEjJm/view?usp=sharing">Download PDF</a> <br /><br />
                    For any questions or further clarification, please feel free to contact me at:
                    <br>
                    <b>• Quality Officer Name:</b> ${QAName}
                    <br>
                    <b>• Quality Officer Email:</b> ${QAEmail}
                    <div style="background-color: red; height: 10px"/>`,
                    email: 'jppalacio@uerm.edu.ph',
                    name: 'JOHN BRIAN'
                };                  
                await util.sendEmail(emailContent);
            }
        }

        res.status(200).json({ message: 'QA DisApproved RCA updated and email sent successfully' });
    } catch (error) {
        console.error('Error in FormDisApprovedRCA:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormCountRCASta = async (req, res) => {
    try {
        const CountRCA = req.body.CountRCA;
        const iRNo = req.body.IRNo;
        const result = await model.countRcaSTA (CountRCA, iRNo)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

const FormQARecommendation = async (req, res) => {
    try {
        const IRNo = req.body.IRNo;
        const lostRec = req.body.lostRec;
        const FinancialLiability = req.body.FinancialLiability;

        const result = await model.QARecom(IRNo, lostRec, FinancialLiability);

        if (result.rowsAffected === 0) {
            return res.status(403).json({ body: 'FAILED TO UPDATE STATUS' });
        }
        res.status(200).json({ body: 'SUCCESS UPDATE' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

const FormDisActionItem = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.DisActioItem(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);

    } catch (error) {
        console.error('Error DISPLAY ActionItem:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormActionStatus = async (req, res) => {
    try {
        const Id = req.body.Id;
        const ActionStatus = req.body.ActionStatus;
        if (!Id) {
            return res.status(400).json({ message: 'Id is required' }); // Check if Id is missing
        }
        const result = await model.AcionItemStatus(Id, ActionStatus);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}


const FormPendingRemarks = async (req, res) => {
    try {
        const IRNo = req.query.iRNo;
        const result = await model.getPendingRemarks(IRNo);
        if (result.recordset.length === 0) {
            return res.status(403).json(result.recordset);
        }
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error inserting Pending Remarks:', error);
        res.status(500).json({ message: 'ERROR' });
    }
}

const FormPostPendingRemarks = async (req, res) => {
    try {
        const IRNo = req.body.IRNo;
        const PendingRemarks = req.body.PendingRemarks;
        const result = await model.IRPendingRem(IRNo, PendingRemarks);
        if (result.rowsAffected[0] === 0) {
            return res.status(403).json({ message: 'Failed to update PendingRemarks' });
        }
        return res.status(200).json({ message: 'Success: PendingRemarks Updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}


const FormQADoneStatus = async (req, res) => {
    try {
        const QAStatus = req.body.QAStatus;
        const IRNo = req.body.IRNo;
        const result = await model.QAStatus(IRNo, QAStatus)
        if (result.rowsAffected === 0){
            res.status(403).json({ body: 'FAILED TO UPDATE STATUS'})
        }
        res.status(200).json({ body: 'SUCCESS UPDATE'})

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}

// const sendEmail = async () => {
//     try {
//         const result = await model.getTime();
//         const records = result.recordset;
//         for (const record of records) {
//             const IRNo = record.IRNo; 
//             const FullName = record.FULLNAME;
//             const SubjectName = record.SubjectName;
//             const QAEmail = record.QAEmail;
//             const timeRcaUpdate = record.DateTimeRCAUpdated;
//             const SendEmailCounts = record.SendEmailCounts

//             if (!timeRcaUpdate) {
//                 const currentDateTime = new Date();
//                 const IRDTCreated = new Date(record.DateTimeCreated);
//                 const differenceInMinutes = Math.abs(currentDateTime - IRDTCreated) / 3600000;

//                 if (differenceInMinutes >= 12 && SendEmailCounts === null) {
//                     await model.updateSendEmailCounts(IRNo, 1);
//                     await PendingEmail(QAEmail, FullName, IRNo, SubjectName);
//                     console.log('Email sent successfully in 12hours');
//                 }

//                 if (differenceInMinutes >= 24 && SendEmailCounts === 1) {
//                     await model.updateSendEmailCounts(IRNo, 2);
//                     await PendingEmail(QAEmail, FullName, IRNo, SubjectName);
//                     console.log('Email sent successfully in 24hours');
//                 }

//                 if (differenceInMinutes >= 36 && SendEmailCounts === 2) {
//                     await model.updateSendEmailCounts(IRNo, 3);
//                     await PendingEmail(QAEmail, FullName, IRNo, SubjectName);
//                     console.log('Email sent successfully in 36hours');
//                 }

//                 if (differenceInMinutes >= 48 && SendEmailCounts === 3) {
//                     await model.updateSendEmailCounts(IRNo, 4);
//                     await PendingEmail(QAEmail, FullName, IRNo, SubjectName);
//                     console.log('End of sending Email within 48hours');
//                 }
//                 if (SendEmailCounts === 4) {
//                     return;
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Error in sendEmail:', error);
//     }
// };

// async function PendingEmail(QAEmail, FullName, IRNo, SubjectName) {
//     if (QAEmail) {
//         const emailContent = {
//             subject: "PENDING INCIDENT REPORT",
//             header: `<div style="background-color: #FFC412; color: darkgray; padding: 15px; height:20px">
//                         PENDING INCIDENT REPORT
//                     </div>`,
//             content: `Dear ${FullName} <br/>
//                 We've detected a pending Incident Report that requires your immediate attention. Please log in to your account and review the report to take the necessary actions.
//                 <br/>
//                 <br/>
//                 <b>Details:</b>
//                 <br/>
//                 <b>IR Number:</b> ${IRNo}
//                 <br/>
//                 <b>Subject of the Incident:</b> ${SubjectName}
//                 <br/>
//                 <br/>
//                 Please ensure that you review and address the report as soon as possible to maintain compliance and ensure timely resolution.
//                 <br/>
//                 Thank you for your prompt attention to this matter.
//                 <div style="background-color: red; height: 10px"/>
//                 ${QAEmail}`,
//             email: 'jppalacio@uerm.edu.ph',
//             name: 'JOHN BRIAN'
//         };
//         await util.sendEmail(emailContent);
//     }
// }



export {
    QAFormDisAll,
    QADisAll,
    FormDisIRF,
    QAInsertEmail,
    FormQATransfer,
    FormApprovedRCA,
    FormDisApprovedRCA,
    FormQARecommendation,
    FormDisActionItem,
    FormActionStatus,
    FormCountRCASta,
    FormREConclusion,
    FormPendingRemarks,
    FormPostPendingRemarks,
    FormQADoneStatus,
    // FormQARefferal,
    // sendEmail
}