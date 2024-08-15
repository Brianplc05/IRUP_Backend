import { Router } from "express";
import * as AGController from "../Controller/AGController.js";

const router = Router();

router.post("/GoogleLogin", AGController.GoogleLogin);

export default router;