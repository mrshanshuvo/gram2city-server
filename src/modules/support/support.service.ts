import { ObjectId, InsertOneResult, UpdateResult, DeleteResult } from "mongodb";
import {
  faqsCollection,
  faqVotesCollection,
  reviewsCollection,
  feedbackCollection,
  notificationsCollection,
  messagesCollection,
} from "../../db/db";
import {
  FAQ,
  Review,
  Feedback,
  Notification,
  ChatMessage,
} from "./support.interface";
import { createNotification } from "../notification/notification.controller";

export class SupportService {
  // FAQs
  static async getFAQs(
    page: number,
    limit: number,
    category?: string,
    sortBy: string = "order",
  ) {
    const skip = (page - 1) * limit;
    const query: any = { isActive: true };
    if (category) query.category = category;

    const sortObj: any = {};
    if (sortBy === "helpful") {
      sortObj.helpfulCount = -1;
    } else {
      sortObj.order = 1;
      sortObj.createdAt = -1;
    }

    const faqs = (await faqsCollection
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray()) as unknown as FAQ[];

    const total = await faqsCollection.countDocuments(query);
    return { faqs, total };
  }

  static async voteFAQHelpful(faqId: string, identifier: string) {
    const existingVote = await faqVotesCollection.findOne({
      faqId: new ObjectId(faqId),
      identifier,
    });

    if (existingVote) {
      return {
        success: false,
        message: "You have already voted for this question.",
      };
    }

    await faqVotesCollection.insertOne({
      faqId: new ObjectId(faqId),
      identifier,
      timestamp: new Date().toISOString(),
    });

    const result = await faqsCollection.updateOne(
      { _id: new ObjectId(faqId) },
      { $inc: { helpfulCount: 1 } },
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "FAQ not found" };
    }

    return { success: true, message: "Thank you for your feedback!" };
  }

  static async getFAQCategories(): Promise<string[]> {
    return faqsCollection.distinct("category", { isActive: true }) as Promise<
      string[]
    >;
  }

  static async getAllFAQsAdmin(): Promise<FAQ[]> {
    return (await faqsCollection
      .find()
      .sort({ order: 1, createdAt: -1 })
      .toArray()) as unknown as FAQ[];
  }

  static async createFAQ(faq: Omit<FAQ, "_id">): Promise<InsertOneResult> {
    return faqsCollection.insertOne(faq);
  }

  static async updateFAQ(
    faqId: string,
    updates: Partial<FAQ>,
  ): Promise<UpdateResult> {
    return faqsCollection.updateOne(
      { _id: new ObjectId(faqId) },
      { $set: updates },
    );
  }

  static async deleteFAQ(faqId: string): Promise<DeleteResult> {
    return faqsCollection.deleteOne({ _id: new ObjectId(faqId) });
  }

  // Reviews
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

  // Feedback
  static async submitFeedback(
    feedback: Omit<Feedback, "_id">,
  ): Promise<InsertOneResult> {
    return feedbackCollection.insertOne(feedback);
  }

  static async getAllFeedback(): Promise<Feedback[]> {
    return (await feedbackCollection
      .find()
      .sort({ timestamp: -1 })
      .toArray()) as unknown as Feedback[];
  }

  // Messages
  static async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    return (await messagesCollection
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .toArray()) as unknown as ChatMessage[];
  }

  static async getUserConversations(email: string): Promise<any[]> {
    return messagesCollection
      .aggregate([
        {
          $match: {
            $or: [{ senderEmail: email }, { receiverEmail: email }],
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiverEmail", email] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { "lastMessage.timestamp": -1 } },
      ])
      .toArray();
  }
}
