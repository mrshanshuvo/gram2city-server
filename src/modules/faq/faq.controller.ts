import { Request, Response } from "express";
import admin from "firebase-admin";
import { FAQService } from "./faq.service";
import { FAQ } from "../../types/types";

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, sortBy = "order" } = req.query;
    const { faqs, total } = await FAQService.getFAQs(
      Number(page),
      Number(limit),
      category as string,
      sortBy as string,
    );

    res.send({
      success: true,
      data: faqs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch FAQs" });
  }
};

export const voteFAQHelpful = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let identifier: string = req.ip || "unknown";

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          if (decoded.email) identifier = decoded.email as string;
        } catch (e) {
          // Fallback to IP
        }
      }
    }

    const result = await FAQService.voteFAQHelpful(
      id as string,
      identifier,
    );
    if (!result.success) {
      return res.status(400).send(result);
    }
    res.send(result);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to process feedback" });
  }
};

export const getFAQCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await FAQService.getFAQCategories();
    res.send({ success: true, data: categories });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch categories" });
  }
};

export const getAllFAQsAdmin = async (_req: Request, res: Response) => {
  try {
    const faqs = await FAQService.getAllFAQsAdmin();
    res.send({ success: true, data: faqs });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch FAQs" });
  }
};

export const createFAQ = async (req: Request, res: Response) => {
  try {
    const { question, answer, order, category } = req.body;
    const newFAQ: FAQ = {
      question,
      answer,
      order: order ? Number(order) : 0,
      category: category || "General",
      isActive: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    };
    const result = await FAQService.createFAQ(newFAQ);
    res
      .status(201)
      .send({ success: true, data: { ...newFAQ, _id: result.insertedId } });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to create FAQ" });
  }
};

export const updateFAQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;

    const result = await FAQService.updateFAQ(id as string, updates);
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "FAQ not found" });
    }
    res.send({ success: true, message: "FAQ updated successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update FAQ" });
  }
};

export const deleteFAQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await FAQService.deleteFAQ(id as string);
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "FAQ not found" });
    }
    res.send({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to delete FAQ" });
  }
};
