import { Request, Response } from "express";
import { NewsletterService } from "./newsletter.service";

export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid email address" });
    }

    const result = await NewsletterService.subscribeNewsletter(email);
    if (!result.success) {
      return res.status(400).send(result);
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Subscription failed" });
  }
};

export const getNewsletterSubscribers = async (
  _req: Request,
  res: Response,
) => {
  try {
    const subscribers = await NewsletterService.getNewsletterSubscribers();
    res.send({ success: true, data: subscribers });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch subscribers" });
  }
};
