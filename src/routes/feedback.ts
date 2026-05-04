import { Router } from "express";
import { feedbackCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit user feedback
 *     tags: [Feedback]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/feedback", verifyFBToken, async (req, res) => {
  try {
    const feedback = {
      ...req.body,
      userEmail: req.user.email,
      timestamp: new Date().toISOString(),
      isResolved: false
    };

    const result = await feedbackCollection.insertOne(feedback);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to submit feedback" });
  }
});

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedback (Admin only)
 *     tags: [Feedback]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/feedback", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const feedback = await feedbackCollection
      .find()
      .sort({ timestamp: -1 })
      .toArray();
    res.send({ success: true, data: feedback });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch feedback" });
  }
});

export default router;
