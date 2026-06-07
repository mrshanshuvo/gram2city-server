import { Router } from "express";
import multer from "multer";
import {
  getFAQs,
  voteFAQHelpful,
  getFAQCategories,
  getAllFAQsAdmin,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getRiderReviews,
  submitReview,
  submitFeedback,
  getAllFeedback,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getChatHistory,
  getUserConversations,
  uploadChatImage,
} from "./support.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { reviewSchema, feedbackSchema } from "./support.schema";

const router = Router();

// Multer for chat image uploads
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// FAQ Routes
router.get("/faqs", getFAQs);
router.patch("/faqs/:id/helpful", voteFAQHelpful);
router.get("/faqs/categories", getFAQCategories);
router.get("/faqs/admin", verifyFBToken, verifyAdmin, getAllFAQsAdmin);
router.post("/faqs", verifyFBToken, verifyAdmin, createFAQ);
router.patch("/faqs/:id", verifyFBToken, verifyAdmin, updateFAQ);
router.delete("/faqs/:id", verifyFBToken, verifyAdmin, deleteFAQ);

// Review Routes
router.get("/reviews/rider/:email", getRiderReviews);
router.post("/reviews", verifyFBToken, validate(reviewSchema), submitReview);

// Feedback Routes
router.post(
  "/feedback",
  verifyFBToken,
  validate(feedbackSchema),
  submitFeedback,
);
router.get("/feedback", verifyFBToken, verifyAdmin, getAllFeedback);

// Notification Routes
router.get("/notifications/:email", verifyFBToken, getUnreadNotifications);
router.patch("/notifications/:id/read", verifyFBToken, markNotificationRead);
router.patch(
  "/notifications/read-all/:email",
  verifyFBToken,
  markAllNotificationsRead,
);

// Messaging Routes
router.get("/messages/:conversationId", verifyFBToken, getChatHistory);
router.get("/messages/conversations", verifyFBToken, getUserConversations);
router.post(
  "/messages/upload-image",
  verifyFBToken,
  chatUpload.single("image"),
  uploadChatImage,
);

export default router;
