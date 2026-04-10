import { Router } from "express";
import { connectGhlController } from "./auth.controller.js";

const router = Router();

router.post("/connect-ghl", connectGhlController);

export default router;
