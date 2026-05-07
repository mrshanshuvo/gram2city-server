import { Router } from "express";
import {
  bannersCollection,
  servicesCollection,
  featuresCollection,
  partnersCollection,
  processStepsCollection,
  landingConfigCollection,
  testimonialsCollection,
  warehousesCollection,
  newsletterCollection,
  ridersCollection,
} from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { newsletterSchema } from "../schemas/commonSchema";
import {
  bannerSchema,
  serviceSchema,
  featureSchema,
  partnerSchema,
  testimonialSchema,
  processStepSchema,
  landingConfigUpdateSchema,
} from "../schemas/landingSchema";
import { ObjectId } from "mongodb";

const router = Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// ... (existing routes)

/**
 * @swagger
 * /landing/process-steps:
 *   get:
 *     summary: Get all active process steps
 *     tags: [Admin - Process Management]
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
 *     tags: [Admin - Landing Config]
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
 *     tags: [Admin - Banner Management]
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
 *     tags: [Admin - Service Management]
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
 *     tags: [Admin - Feature Management]
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
 *     tags: [Admin - Partner Management]
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
 *     tags: [Admin - Testimonial Management]
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

// ─── STATS (Public) ───────────────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  try {
    const warehouses = await warehousesCollection.find({}).toArray();
    const totalDistricts = [...new Set(warehouses.map((w) => w.district))];
    const activeHubs = warehouses.filter((w) => w.status === "active").length;
    const expressZones = warehouses.filter(
      (w) => w.status === "limited",
    ).length;
    const approvedRiders = await ridersCollection.countDocuments({
      status: "approved",
    });

    console.log(
      `[STATS] Districts: ${totalDistricts.length}, Active: ${activeHubs}, Riders: ${approvedRiders}`,
    );

    res.send({
      success: true,
      data: {
        districts: totalDistricts.length || 64, // Fallback to 64 if DB is being seeded
        activeHubs: activeHubs || 0,
        expressZones: expressZones || 0,
        riders: approvedRiders || 0,
      },
    });
  } catch (error) {
    console.error("[STATS ERROR]", error);
    res.status(500).send({ success: false, message: "Error fetching stats" });
  }
});

// ─── NEWSLETTER (Public) ──────────────────────────────────────────────────
// Newsletter subscription is public, but list is admin-only (moved below)

/**
 * @swagger
 * /landing/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Public - Newsletter]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       201: { description: "Subscribed" }
 *       400: { description: "Validation failed" }
 */
router.post("/subscribe", validate(newsletterSchema), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid email address" });
    }

    const existing = await newsletterCollection.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .send({ success: false, message: "Already subscribed!" });
    }

    await newsletterCollection.insertOne({
      email,
      subscribedAt: new Date().toISOString(),
    });

    res.send({ success: true, message: "Welcome to the family!" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Subscription failed" });
  }
});

router.get("/warehouses", async (req, res) => {
  try {
    const { search, district, status } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { district: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } },
      ];
    }

    if (district) query.district = district;
    if (status) query.status = status;

    const data = await warehousesCollection.find(query).toArray();
    res.send({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Error fetching warehouses" });
  }
});

// ─── ADMIN ROUTES (Management) ──────────────────────────────────────────────

router.use(verifyFBToken, verifyAdmin);

/**
 * @swagger
 * /landing/config:
 *   patch:
 *     summary: Update global landing configuration
 *     tags: [Admin - Landing Config]
 */
router.patch("/config", validate(landingConfigUpdateSchema), async (req, res) => {
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
const handleCRUD = (collection: any, name: string, schema?: any) => {
  router.post(`/${name}`, schema ? validate(schema) : (req, res, next) => next(), async (req, res) => {
    try {
      const item = req.body;
      // We don't force isActive if it's already in the body (schema allows it)
      if (item.isActive === undefined) item.isActive = true;
      item.createdAt = new Date().toISOString();
      const result = await collection.insertOne(item);
      res.send({ success: true, data: { ...item, _id: result.insertedId } });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: `Failed to create ${name}` });
    }
  });

  router.patch(`/${name}/:id`, schema ? validate(schema) : (req, res, next) => next(), async (req, res) => {
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

// Admin Only Newsletter List
router.get("/newsletter", async (_req, res) => {
  try {
    const subscribers = await newsletterCollection
      .find({})
      .sort({ subscribedAt: -1 })
      .toArray();
    res.send({ success: true, data: subscribers });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch subscribers" });
  }
});

/**
 * @swagger
 * /landing/banners:
 *   post:
 *     summary: Create a new banner
 *     tags: [Admin - Banner Management]
 * /landing/banners/{id}:
 *   patch:
 *     summary: Update a banner
 *     tags: [Admin - Banner Management]
 *   delete:
 *     summary: Delete a banner
 *     tags: [Admin - Banner Management]
 */
handleCRUD(bannersCollection, "banners", bannerSchema);

/**
 * @swagger
 * /landing/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Admin - Service Management]
 * /landing/services/{id}:
 *   patch:
 *     summary: Update a service
 *     tags: [Admin - Service Management]
 *   delete:
 *     summary: Delete a service
 *     tags: [Admin - Service Management]
 */
handleCRUD(servicesCollection, "services", serviceSchema);

/**
 * @swagger
 * /landing/features:
 *   post:
 *     summary: Create a new feature card
 *     tags: [Admin - Feature Management]
 * /landing/features/{id}:
 *   patch:
 *     summary: Update a feature card
 *     tags: [Admin - Feature Management]
 *   delete:
 *     summary: Delete a feature card
 *     tags: [Admin - Feature Management]
 */
handleCRUD(featuresCollection, "features", featureSchema);

/**
 * @swagger
 * /landing/partners:
 *   post:
 *     summary: Create a new partner
 *     tags: [Admin - Partner Management]
 * /landing/partners/{id}:
 *   patch:
 *     summary: Update a partner
 *     tags: [Admin - Partner Management]
 *   delete:
 *     summary: Delete a partner
 *     tags: [Admin - Partner Management]
 */
handleCRUD(partnersCollection, "partners", partnerSchema);

/**
 * @swagger
 * /landing/process-steps:
 *   post:
 *     summary: Create a new process step
 *     tags: [Admin - Process Management]
 * /landing/process-steps/{id}:
 *   patch:
 *     summary: Update a process step
 *     tags: [Admin - Process Management]
 *   delete:
 *     summary: Delete a process step
 *     tags: [Admin - Process Management]
 */
handleCRUD(processStepsCollection, "process-steps", processStepSchema);

/**
 * @swagger
 * /landing/testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Admin - Testimonial Management]
 * /landing/testimonials/{id}:
 *   patch:
 *     summary: Update a testimonial
 *     tags: [Admin - Testimonial Management]
 *   delete:
 *     summary: Delete a testimonial
 *     tags: [Admin - Testimonial Management]
 */
handleCRUD(testimonialsCollection, "testimonials", testimonialSchema);

export default router;
