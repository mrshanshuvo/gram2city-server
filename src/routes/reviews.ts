import { Router } from "express";
import { reviewsCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { reviewSchema } from "../schemas/commonSchema";

const router = Router();

/**
 * @swagger
 * /reviews/rider/{email}:
 *   get:
 *     summary: Get reviews for a specific rider
 *     tags: [Feedback]
 *     parameters: [{ name: "email", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/reviews/rider/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const reviews = await reviewsCollection
      .find({ rider_email: email })
      .sort({ date: -1 })
      .toArray();
    res.send(reviews);
  } catch {
    res.status(500).send({ error: "Failed to fetch reviews" });
  }
});

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a rider review
 *     tags: [Feedback]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: "Review submitted" }
 *       400: { description: "Validation failed" }
 */
router.post(
  "/reviews",
  verifyFBToken,
  validate(reviewSchema),
  async (req, res) => {
    const review = req.body;
    review.date = new Date().toISOString();
    try {
      const result = await reviewsCollection.insertOne(review);
      res.send({ success: true, data: result });
    } catch {
      res.status(500).send({ error: "Failed to submit review" });
    }
  },
);

export default router;
