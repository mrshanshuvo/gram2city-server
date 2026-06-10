import { InsertOneResult } from "mongodb";
import { reviewsCollection } from "../../../db/db";
import { Review } from "../../../types/types";
import { createNotification } from "../../notification/notification.controller";

export class ReviewService {
  static async getRiderReviews(email: string): Promise<Review[]> {
    return (await reviewsCollection
      .find({ rider_email: email })
      .sort({ date: -1 })
      .toArray()) as unknown as Review[];
  }

  static async submitReview(review: Review): Promise<InsertOneResult> {
    const result = await reviewsCollection.insertOne(review);

    // Notify the rider they received a new review
    if (review.rider_email) {
      const stars = "⭐".repeat(
        Math.min(Math.max(Number(review.rating), 1), 5),
      );
      const commentPart = review.comment
        ? `: "${String(review.comment).substring(0, 50)}${String(review.comment).length > 50 ? "..." : ""}"`
        : "";
      await createNotification({
        email: review.rider_email,
        message: `New Review: A customer rated you ${stars} (${review.rating}/5)${commentPart}`,
        type: "admin_alert",
      });
    }

    return result;
  }
}
