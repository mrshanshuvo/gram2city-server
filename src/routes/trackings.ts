import { Router } from "express";
import { trackingCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /trackings/{trackingId}:
 *   get:
 *     summary: Track a parcel journey (Public)
 *     tags: [Customer Portal]
 *     security: []
 *     parameters: [{ name: "trackingId", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/trackings/:trackingId", async (req, res) => {
  try {
    const { trackingId } = req.params;
    const updates = await trackingCollection
      .find({ trackingId })
      .sort({ time: -1 })
      .toArray();
    
    if (updates.length === 0) {
      return res.status(404).send({ success: false, message: "No tracking history found for this ID." });
    }

    res.send({ success: true, trackingId, history: updates });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch tracking info." });
  }
});

/**
 * @swagger
 * /trackings:
 *   post:
 *     summary: Manually add a tracking update (Admin Only)
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [trackingId, status, details]
 *             properties:
 *               trackingId: { type: string }
 *               status: { type: string }
 *               details: { type: string }
 *               location: { type: string }
 *     responses:
 *       201: { description: "Created" }
 */
router.post("/trackings", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { trackingId, status, details, location } = req.body;
    
    if (!trackingId || !status || !details) {
      return res.status(400).send({ success: false, message: "Missing required fields" });
    }

    const update = {
      trackingId,
      status,
      details,
      location: location || "Processing Center",
      time: new Date().toISOString()
    };

    const result = await trackingCollection.insertOne(update);
    res.status(201).send({ success: true, message: "Tracking update added.", id: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

export default router;
