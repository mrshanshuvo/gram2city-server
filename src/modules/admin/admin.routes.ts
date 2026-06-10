import { Router } from "express";
import {
  getAuditLogs,
  getStats,
  announce,
  getSettings,
  updateSettings,
  getFleet,
} from "./admin.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  adminSettingsSchema,
  announceSchema,
} from "./admin.schema";

const router = Router();

// Apply Admin security to ALL routes in this file
router.use(verifyFBToken, verifyAdmin);

router.get("/audit-logs", getAuditLogs);
router.get("/stats", getStats);
router.post("/announce", validate(announceSchema), announce);
router.get("/settings", getSettings);
router.patch("/settings", validate(adminSettingsSchema), updateSettings);
router.get("/fleet", getFleet);

export default router;
