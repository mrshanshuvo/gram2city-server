import { feedbackCollection } from "../../db/db";
import { Feedback } from "../../types/types";

export class FeedbackService {
  static async getAllFeedback(): Promise<Feedback[]> {
    return (await feedbackCollection
      .find()
      .sort({ timestamp: -1 })
      .toArray()) as unknown as Feedback[];
  }
}
