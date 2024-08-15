
import { Router } from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import * as LoginController from "../Controller/LoginController.js";
import * as IRLoginController from "../Controller/IRLoginController.js"

const router = Router();

router.post("/Login", LoginController.login);
router.post("/IRLogin", IRLoginController.IRLogin);
router.get("/protected-route", verifyToken, LoginController.protectedRoute);

export default router;
