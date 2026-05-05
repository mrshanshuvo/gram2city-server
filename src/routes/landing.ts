import { Router } from "express";
import {
  bannersCollection,
  servicesCollection,
  featuresCollection,
  partnersCollection,
  processStepsCollection,
  landingConfigCollection
} from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// ... (existing routes)

/**
 * @swagger
 * /landing/process-steps:
 *   get:
 *     summary: Get all active process steps
 *     tags: [Landing Page]
 */
router.get("/process-steps", async (req, res) => {
  try {
    const steps = await processStepsCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    res.send({ success: true, data: steps });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /landing/config:
 *   get:
 *     summary: Get global landing configuration
 *     tags: [Landing Page]
 */
router.get("/config", async (req, res) => {
  try {
    const config = await landingConfigCollection.findOne({});
    res.send({ success: true, data: config });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /landing/banners:
 *   get:
 *     summary: Get all active banner slides
 *     tags: [Landing Page]
 */
router.get("/banners", async (req, res) => {
  try {
    const banners = await bannersCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    res.send({ success: true, data: banners });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /landing/services:
 *   get:
 *     summary: Get all active services
 *     tags: [Landing Page]
 */
router.get("/services", async (req, res) => {
  try {
    const services = await servicesCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    res.send({ success: true, data: services });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /landing/features:
 *   get:
 *     summary: Get all active feature cards
 *     tags: [Landing Page]
 */
router.get("/features", async (req, res) => {
  try {
    const features = await featuresCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    res.send({ success: true, data: features });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /landing/partners:
 *   get:
 *     summary: Get all partner logos
 *     tags: [Landing Page]
 */
router.get("/partners", async (req, res) => {
  try {
    const partners = await partnersCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    res.send({ success: true, data: partners });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

// ─── ADMIN ROUTES (Management) ──────────────────────────────────────────────

router.use(verifyFBToken, verifyAdmin);

/**
 * @swagger
 * /landing/config:
 *   patch:
 *     summary: Update global landing configuration
 *     tags: [Landing Page]
 */
router.patch("/config", async (req, res) => {
  try {
    const update = req.body;
    await landingConfigCollection.updateOne({}, { $set: update }, { upsert: true });
    res.send({ success: true, message: "Configuration updated" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update config" });
  }
});

// Generic function to handle landing page CRUD can be added here
// For now, providing basic management routes

router.post("/banners", async (req, res) => {
  try {
    const banner = req.body;
    banner.isActive = true;
    banner.createdAt = new Date().toISOString();
    const result = await bannersCollection.insertOne(banner);
    res.send({ success: true, data: result });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to create banner" });
  }
});

router.patch("/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    await bannersCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    res.send({ success: true, message: "Banner updated" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update banner" });
  }
});

// Similarly for services, features, and partners...

export default router;
