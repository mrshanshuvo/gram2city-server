import { newsletterCollection } from "../../../db/db";

export class NewsletterService {
  static async subscribeNewsletter(email: string) {
    const existing = await newsletterCollection.findOne({ email });
    if (existing) {
      return { success: false, message: "Already subscribed!" };
    }

    await newsletterCollection.insertOne({
      email,
      subscribedAt: new Date().toISOString(),
    });

    return { success: true, message: "Welcome to the family!" };
  }

  static async getNewsletterSubscribers(): Promise<any[]> {
    return newsletterCollection.find({}).sort({ subscribedAt: -1 }).toArray();
  }
}
