import { Router } from "express";
import { settingsCollection, parcelCollection, ridersCollection } from "../db";

const router = Router();

/**
 * @swagger
 * /public/settings:
 *   get:
 *     summary: Get Public System Settings (Pricing)
 *     tags: [Public]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/settings", async (req, res) => {
  try {
    const settings = await settingsCollection.findOne({});
    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /public/tracking/{trackingId}:
 *   get:
 *     summary: Public Parcel Tracking
 *     tags: [Public]
 *     parameters: [{ name: "trackingId", in: path, required: true, schema: { type: string } }]
 */
router.get("/tracking/:trackingId", async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { trackingCollection } = require("../db");
    const history = await trackingCollection.find({ trackingId }).sort({ time: -1 }).toArray();
    res.send({ success: true, history });
  } catch (error) {
    res.status(500).send({ success: false, message: "Tracking failed" });
  }
});

export default router;
