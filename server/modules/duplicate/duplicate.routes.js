import { Router } from "express";
import { authenticateAccessKey } from "../../middleware/access-key.middleware.js";
import { checkDuplicateController } from "./duplicate.controller.js";

const router = Router();

router.post("/check", authenticateAccessKey, checkDuplicateController);

export default router;
