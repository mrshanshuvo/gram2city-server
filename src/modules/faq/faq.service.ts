import { ObjectId, InsertOneResult, UpdateResult, DeleteResult } from "mongodb";
import { faqsCollection, faqVotesCollection } from "../../db/db";
import { FAQ } from "../../types/types";

export class FAQService {
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
}
