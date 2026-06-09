import { Router } from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notification.controller";
import { verifyFBToken } from "../../middleware/auth";

const router = Router();

router.get("/:email", verifyFBToken, getUserNotifications);
router.patch("/:id/read", verifyFBToken, markNotificationRead);
router.patch("/read-all/:email", verifyFBToken, markAllNotificationsRead);

export default router;
