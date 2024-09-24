import { Router } from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import * as DBController from "../Controller/DBController.js";
import * as ReportController from "../Controller/ReportController.js";
import * as QAController from "../Controller/QAController.js";
import * as IRController from "../Controller/IRController.js";
import * as HRController from "../Controller/HRController.js";
import * as EmploController from "../Controller/EmploController.js";
import * as DirectorController from "../Controller/DirectorController.js";
import * as AssitantQAController from "../Controller/AssitantQAController.js";
import * as AuditController from "../Controller/AuditController.js";

const router = Router();

////IRFORM/////
router.get("/EmpdeptForm", IRController.FormEmdept); 
router.get("/SubNameForm", IRController.FormSubName);  
router.get("/SubCategoryForm", IRController.FormSubCategory);
router.get("/DivisionForm", IRController.FormDivision);
router.post("/AddIncident", IRController.FormIncident);
////////////////////////////////////////

/////////////DASHBOARD///////////
router.get("/DisplayDashboard", verifyToken, DBController.DisAllDashboard); 
//////////////////////////////////////

/////////////REPORTTABLE///////////
router.get("/DisplayCountSubject", ReportController.FormDisCountSub);
router.get("/DisplayMatchDepartment", ReportController.FormDisMatchDept); 
router.get("/DisplayTotalActionItem", ReportController.FormDisTotalAct);
//////////////////////////////////////

/////////////DIRECTORTABLE///////////
router.get("/DisplayDirectorForm",  verifyToken, DirectorController.DirectorFormDisAll); 
router.get("/DisplayDirectorIRP", DirectorController.FormDisDirectorIRF); 
router.put("/AddRecommendationDirector", DirectorController.FormDirectorRecommendation);
//////////////////////////////////////

/////////////ASSISTANTQA TABLE///////////
router.get("/DisplayAssistantQASub", verifyToken, AssitantQAController.FormAssistantQASub);
router.get("/DisplayAQA", AssitantQAController.FormDisAQA); 
router.get("/DisplaySubjectCode", AssitantQAController.FormDisSubject); 
router.get("/DisplayDivisionCode", AssitantQAController.FormDisDivision); 
router.put("/PutSubjectCode", verifyToken, AssitantQAController.FormUpdateSubCode);
router.put("/PutDivisionCode", AssitantQAController.FormUpdateDivCode);
//////////////////////////////////////


/////////////QATABLE///////////
router.get("/DisplayQAForm", verifyToken, QAController.QAFormDisAll); 
router.get("/DisplayIRP", QAController.FormDisIRF); 
router.get("/DepartmentForm", IRController.FormDepDis); 
router.post("/AddQADeptEmail", QAController.QAInsertEmail);
// router.post("/AddConclusion", QAController.FormConclusion);
router.get("/DisplayQA", QAController.QADisAll);
router.post("/AddQATransfer", QAController.FormQATransfer);
// router.put("/AddQARefferal", QAController.FormQARefferal);
router.post("/AddREConclusion", QAController.FormREConclusion);
router.put("/PutRCASub", QAController.FormCountRCASta);
router.post("/AddApprovedRCA", QAController.FormApprovedRCA);
router.post("/AddDisApprovedRCA", QAController.FormDisApprovedRCA);
router.get("/DisplayActionItem", QAController.FormDisActionItem); 
router.put("/putActionItemStatus", QAController.FormActionStatus);
router.get("/DisplayPendingRemarks", QAController.FormPendingRemarks);
router.post("/AddPendingRemarks", QAController.FormPostPendingRemarks);
router.put("/putQADStatus", QAController.FormQADoneStatus);
//////////////////////////////

////HRTABLE/////
router.get("/DisplayForm", verifyToken, HRController.FormDisAll); 
router.put("/puthrStatus", HRController.FormHRSta);
router.get("/DisplayHRIRP", HRController.FormDisHRIRF); 
router.put("/AddFinancialLiability", HRController.FormFinancialLiability);
router.put("/puthrAct", HRController.FormHRAct);
router.post("/AddNote", HRController.FormHRN);
router.post("/AddHRNote", HRController.FormHRNotes);
router.post("/AddEmplo", IRController.FormEmployee);
router.get("/DisEmploForm", IRController.FormEmploDet); 
// router.post("/AddDept", IRController.FormDeptment);
router.get("/CodeDisForm", IRController.FormCBDis); 
router.get("/SpecificOfForm", IRController.FormSpeOfDis); 
////////////////////////////////////////

////HRDEMERIT/////
router.get("/DisplayEmployees", EmploController.DisAllEmployee);
router.get("/DisplayEmpTab", EmploController.FormEmpTab);
////////////////////////////////////////

////////////AUDIT////////////////////
router.get("/DisplayTab", verifyToken, AuditController.FormTab);
router.get("/DisplaySubjectTab", AuditController.FormSubjectTab);
router.post("/AddSubjectDetails", AuditController.FormSubjectNote);
router.get("/DisplayRiskTab", AuditController.FormRiskTab);
router.get("/DomainCodeForm", AuditController.FormDomainCode);
router.post("/AddRiskDic", AuditController.FormRiskCode);
router.post("/AddAudit", AuditController.FormAudit);
router.get("/DisplayNote", AuditController.FormNote);
router.put("/DeletedNote", AuditController.FormdelNote);
router.put("/EditNote", AuditController.FormEdNote);
router.put("/Putaudit", AuditController.FormAuditSta);
////////////////////////////////////////


function runSendEmailRouteEvery12Hours() {
    setInterval(() => {
        // Call the route handler
        QAController.sendEmail();
    }, 1000); // Check every 1 second
}

runSendEmailRouteEvery12Hours();

export default router ;