import { Router } from "express";
import { webhookController } from "./webhook.controller.js";

const router = Router();

router.post("/ghl", webhookController);

export default router;
