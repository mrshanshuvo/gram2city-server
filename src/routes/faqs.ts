import { Router } from "express";
import { ObjectId } from "mongodb";
import { faqsCollection, faqVotesCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import { FAQ } from "../types";
import admin from "firebase-admin";

const router = Router();

/**
 * @swagger
 * /faqs:
 *   get:
 *     summary: Fetch FAQs with pagination and optional category filtering
 *     tags: [FAQs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [order, helpful]
 *           default: order
 *         description: Sort by order or popularity (helpfulCount)
 */
router.get("/faqs", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = "order" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = { isActive: true };
    if (category) query.category = category;

    const sortObj: any = {};
    if (sortBy === "helpful") {
      sortObj.helpfulCount = -1;
    } else {
      sortObj.order = 1;
      sortObj.createdAt = -1;
    }

    const faqs = await faqsCollection
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await faqsCollection.countDocuments(query);

    res.send({ 
      success: true, 
      data: faqs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch FAQs" });
  }
});

/**
 * @swagger
 * /faqs/{id}/helpful:
 *   patch:
 *     summary: Mark an FAQ as helpful (increments helpfulCount)
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The FAQ ID
 *     responses:
 *       200:
 *         description: Vote counted successfully
 *       400:
 *         description: Already voted for this question
 *       404:
 *         description: FAQ not found
 */
router.patch("/faqs/:id/helpful", async (req, res) => {
  try {
    const { id } = req.params;
    let identifier: string = req.ip || "unknown";

    // Optional: Extract email if token is provided
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          if (decoded.email) identifier = decoded.email as string;
        } catch (e) {
          // Fallback to IP if token is invalid
        }
      }
    }

    // Check for existing vote
    const existingVote = await faqVotesCollection.findOne({
      faqId: new ObjectId(id as string),
      identifier
    });

    if (existingVote) {
      return res.status(400).send({ 
        success: false, 
        message: "You have already voted for this question." 
      });
    }

    // Record the vote
    await faqVotesCollection.insertOne({
      faqId: new ObjectId(id as string),
      identifier,
      timestamp: new Date().toISOString()
    });

    // Increment count
    const result = await faqsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $inc: { helpfulCount: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "FAQ not found" });
    }
    res.send({ success: true, message: "Thank you for your feedback!" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to process feedback" });
  }
});

/**
 * @swagger
 * /faqs/categories:
 *   get:
 *     summary: Fetch unique FAQ categories
 *     tags: [FAQs]
 */
router.get("/faqs/categories", async (_req, res) => {
  try {
    const categories = await faqsCollection.distinct("category", { isActive: true });
    res.send({ success: true, data: categories });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch categories" });
  }
});

/**
 * @swagger
 * /faqs/admin:
 *   get:
 *     summary: Fetch all FAQs for admin management
 *     tags: [FAQs]
 */
router.get("/faqs/admin", verifyFBToken, verifyAdmin, async (_req, res) => {
  try {
    const faqs = await faqsCollection
      .find()
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    res.send({ success: true, data: faqs });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch FAQs" });
  }
});

/**
 * @swagger
 * /faqs:
 *   post:
 *     summary: Create a new FAQ (Admin only)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *               order: { type: integer }
 *               category: { type: string }
 */
router.post("/faqs", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { question, answer, order, category } = req.body;
    const newFAQ: FAQ = {
      question,
      answer,
      order: order || 0,
      category: category || "General",
      isActive: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    };
    const result = await faqsCollection.insertOne(newFAQ);
    res.status(201).send({ success: true, data: { ...newFAQ, _id: result.insertedId } });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to create FAQ" });
  }
});

/**
 * @swagger
 * /faqs/{id}:
 *   patch:
 *     summary: Update an FAQ (Admin only)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch("/faqs/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;

    const result = await faqsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "FAQ not found" });
    }
    res.send({ success: true, message: "FAQ updated successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update FAQ" });
  }
});

/**
 * @swagger
 * /faqs/{id}:
 *   delete:
 *     summary: Delete an FAQ (Admin only)
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/faqs/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await faqsCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "FAQ not found" });
    }
    res.send({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to delete FAQ" });
  }
});

export default router;
