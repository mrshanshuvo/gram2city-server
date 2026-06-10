import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import { Review } from "../../../types/types";

export const getPublicRiderReviews = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const reviews = await ReviewService.getRiderReviews(email as string);
    res.send(reviews);
  } catch {
    res.status(500).send({ error: "Failed to fetch reviews" });
  }
};

export const submitRiderReview = async (req: Request, res: Response) => {
  const review = req.body as Review;
  review.date = new Date().toISOString();
  try {
    const result = await ReviewService.submitReview(review);
    res.send({ success: true, data: result });
  } catch {
    res.status(500).send({ error: "Failed to submit review" });
  }
};
