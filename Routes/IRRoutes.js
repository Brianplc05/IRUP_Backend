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
router.get("/EmpdeptForm", verifyToken, IRController.FormEmdept); 
router.get("/SubNameForm", verifyToken, IRController.FormSubName);  
router.get("/SubCategoryForm", verifyToken, IRController.FormSubCategory);
router.get("/DivisionForm", verifyToken, IRController.FormDivision);
router.post("/AddIncident", verifyToken, IRController.FormIncident);
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
router.get("/DisplayDirectorIRP", verifyToken, DirectorController.FormDisDirectorIRF); 
router.put("/AddRecommendationDirector", verifyToken, DirectorController.FormDirectorRecommendation);
//////////////////////////////////////

/////////////ASSISTANTQA TABLE///////////
router.get("/DisplayAssistantQASub", verifyToken, AssitantQAController.FormAssistantQASub);
router.get("/DisplayAQA", verifyToken, AssitantQAController.FormDisAQA); 
router.get("/DisplaySubjectCode", verifyToken, AssitantQAController.FormDisSubject); 
router.get("/DisplayDivisionCode", verifyToken, AssitantQAController.FormDisDivision); 
router.put("/PutSubjectCode", verifyToken, AssitantQAController.FormUpdateSubCode);
router.put("/PutDivisionCode", verifyToken, AssitantQAController.FormUpdateDivCode);
//////////////////////////////////////


/////////////QATABLE///////////
router.get("/DisplayQAForm", verifyToken, QAController.QAFormDisAll); 
router.get("/DisplayIRP", verifyToken, QAController.FormDisIRF); 
router.get("/DepartmentForm", verifyToken, IRController.FormDepDis); 
router.post("/AddQADeptEmail", verifyToken, QAController.QAInsertEmail);
// router.post("/AddConclusion", QAController.FormConclusion);
router.get("/DisplayQA", verifyToken, QAController.QADisAll);
router.post("/AddQATransfer", verifyToken, QAController.FormQATransfer);
// router.put("/AddQARefferal", QAController.FormQARefferal);
router.post("/AddREConclusion", verifyToken, QAController.FormREConclusion);
router.put("/PutRCASub", verifyToken, QAController.FormCountRCASta);
router.post("/AddApprovedRCA", verifyToken, QAController.FormApprovedRCA);
router.post("/AddDisApprovedRCA", verifyToken, QAController.FormDisApprovedRCA);
router.get("/DisplayActionItem", verifyToken, QAController.FormDisActionItem); 
router.put("/putActionItemStatus", verifyToken, QAController.FormActionStatus);
router.get("/DisplayPendingRemarks", verifyToken, QAController.FormPendingRemarks);
router.post("/AddPendingRemarks", verifyToken, QAController.FormPostPendingRemarks);
router.put("/putQADStatus", verifyToken, QAController.FormQADoneStatus);
//////////////////////////////

////HRTABLE/////
router.get("/DisplayForm", verifyToken, HRController.FormDisAll); 
router.put("/puthrStatus", verifyToken, HRController.FormHRSta);
router.get("/DisplayHRIRP", verifyToken, HRController.FormDisHRIRF); 
router.put("/AddFinancialLiability", verifyToken, HRController.FormFinancialLiability);
router.put("/puthrAct", verifyToken, HRController.FormHRAct);
router.post("/AddNote", verifyToken, HRController.FormHRN);
router.post("/AddHRNote", verifyToken, HRController.FormHRNotes);
router.post("/AddEmplo", verifyToken, IRController.FormEmployee);
router.get("/DisEmploForm", verifyToken, IRController.FormEmploDet); 
// router.post("/AddDept", IRController.FormDeptment);
router.get("/CodeDisForm", verifyToken, IRController.FormCBDis); 
router.get("/SpecificOfForm", verifyToken, IRController.FormSpeOfDis); 
////////////////////////////////////////

////HRDEMERIT/////
router.get("/DisplayEmployees", verifyToken, EmploController.DisAllEmployee);
router.get("/DisplayEmpTab", verifyToken, EmploController.FormEmpTab);
////////////////////////////////////////

////////////AUDIT////////////////////
router.get("/DisplayTab", verifyToken, AuditController.FormTab);
router.get("/DisplaySubjectTab", verifyToken, AuditController.FormSubjectTab);
router.post("/AddSubjectDetails", verifyToken, AuditController.FormSubjectNote);
router.get("/DisplayRiskTab", verifyToken, AuditController.FormRiskTab);
router.get("/DomainCodeForm", verifyToken, AuditController.FormDomainCode);
router.post("/AddRiskDic", verifyToken, AuditController.FormRiskCode);
router.post("/AddAudit", verifyToken, AuditController.FormAudit);
router.get("/DisplayNote", verifyToken, AuditController.FormNote);
router.put("/DeletedNote", verifyToken, AuditController.FormdelNote);
router.put("/EditNote", verifyToken, AuditController.FormEdNote);
router.put("/Putaudit", verifyToken, AuditController.FormAuditSta);
////////////////////////////////////////


function runSendEmailRouteEvery12Hours() {
    setInterval(() => {
        // Call the route handler
        QAController.sendEmail();
    }, 1000); // Check every 1 second
}

runSendEmailRouteEvery12Hours();

export default router ;