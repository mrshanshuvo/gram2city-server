import { Router } from "express";
import {
  getFAQs,
  voteFAQHelpful,
  getFAQCategories,
  getAllFAQsAdmin,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "./faq.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";

const router = Router();

router.get("/faqs", getFAQs);
router.patch("/faqs/:id/helpful", voteFAQHelpful);
router.get("/faqs/categories", getFAQCategories);
router.get("/faqs/admin", verifyFBToken, verifyAdmin, getAllFAQsAdmin);
router.post("/faqs", verifyFBToken, verifyAdmin, createFAQ);
router.patch("/faqs/:id", verifyFBToken, verifyAdmin, updateFAQ);
router.delete("/faqs/:id", verifyFBToken, verifyAdmin, deleteFAQ);

export default router;
