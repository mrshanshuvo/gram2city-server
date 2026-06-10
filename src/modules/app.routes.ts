import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import userRoutes from "./user/user.routes";
import adminRoutes from "./admin/admin.routes";
import parcelRoutes from "./parcel/parcel.routes";
import riderRoutes from "./rider/rider.routes";
import financeRoutes from "./finance/finance.routes";
import faqRoutes from "./faq/faq.routes";
import feedbackRoutes from "./feedback/feedback.routes";
import chatRoutes from "./chat/chat.routes";
import notificationRoutes from "./notification/notification.routes";
import contentRoutes from "./content/content.routes";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/", authRoutes);
router.use("/", userRoutes);
router.use("/", parcelRoutes);
router.use("/", riderRoutes);
router.use("/", financeRoutes);
router.use("/", faqRoutes);
router.use("/", feedbackRoutes);
router.use("/", chatRoutes);
router.use("/", contentRoutes);

export default router;
