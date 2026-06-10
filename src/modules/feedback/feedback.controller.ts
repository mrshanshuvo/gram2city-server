import { Request, Response } from "express";
import { FeedbackService } from "./feedback.service";

export const getAllFeedback = async (_req: Request, res: Response) => {
  try {
    const feedback = await FeedbackService.getAllFeedback();
    res.send({ success: true, data: feedback });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch feedback" });
  }
};
