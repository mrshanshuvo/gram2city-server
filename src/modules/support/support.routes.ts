import { Router } from "express";
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
} from "./support.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { reviewSchema, feedbackSchema } from "./support.schema";

const router = Router();

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

export default router;
