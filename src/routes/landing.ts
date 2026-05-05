import { Router } from "express";
import {
  bannersCollection,
  servicesCollection,
  featuresCollection,
  partnersCollection,
  processStepsCollection,
  landingConfigCollection,
  testimonialsCollection,
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

/**
 * @swagger
 * /landing/testimonials:
 *   get:
 *     summary: Get all active testimonials
 *     tags: [Landing Page]
 */
router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await testimonialsCollection
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();
    res.send({ success: true, data: testimonials });
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
    delete update._id;
    await landingConfigCollection.updateOne(
      {},
      { $set: update },
      { upsert: true },
    );
    res.send({ success: true, message: "Configuration updated" });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update config" });
  }
});

// Helper for Generic CRUD
const handleCRUD = (collection: any, name: string) => {
  router.post(`/${name}`, async (req, res) => {
    try {
      const item = req.body;
      item.isActive = true;
      item.createdAt = new Date().toISOString();
      const result = await collection.insertOne(item);
      res.send({ success: true, data: { ...item, _id: result.insertedId } });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: `Failed to create ${name}` });
    }
  });

  router.patch(`/${name}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const update = req.body;
      delete update._id;
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update },
      );
      if (result.matchedCount === 0)
        return res.status(404).send({ success: false, message: "Not found" });
      res.send({ success: true, message: `${name} updated` });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: `Failed to update ${name}` });
    }
  });

  router.delete(`/${name}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0)
        return res.status(404).send({ success: false, message: "Not found" });
      res.send({ success: true, message: `${name} deleted` });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: `Failed to delete ${name}` });
    }
  });
};

handleCRUD(bannersCollection, "banners");
handleCRUD(servicesCollection, "services");
handleCRUD(featuresCollection, "features");
handleCRUD(partnersCollection, "partners");
handleCRUD(processStepsCollection, "process-steps");
handleCRUD(testimonialsCollection, "testimonials");

export default router;
