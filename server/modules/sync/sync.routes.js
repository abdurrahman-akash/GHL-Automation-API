import { Router } from "express";
import { authenticateAccessKey } from "../../middleware/access-key.middleware.js";
import { getSyncStatusController, triggerSyncController } from "./sync.controller.js";

const router = Router();

router.post("/trigger", authenticateAccessKey, triggerSyncController);
router.get("/status", authenticateAccessKey, getSyncStatusController);

export default router;
