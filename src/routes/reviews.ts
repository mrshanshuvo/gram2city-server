import { Router } from "express";
import { reviewsCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();

// GET /reviews/rider/:email
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

// POST /reviews
router.post("/reviews", verifyFBToken, async (req, res) => {
  const review = req.body;
  review.date = new Date().toISOString();
  try {
    const result = await reviewsCollection.insertOne(review);
    res.send({ success: true, data: result });
  } catch {
    res.status(500).send({ error: "Failed to submit review" });
  }
});

export default router;
