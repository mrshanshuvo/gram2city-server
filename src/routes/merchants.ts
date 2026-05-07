import { Router } from "express";
import { ObjectId } from "mongodb";
import { merchantsCollection, usersCollection, parcelCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";
import { Merchant } from "../types";

const router = Router();

/**
 * @swagger
 * /merchants:
 *   post:
 *     summary: Apply for a Merchant Account
 *     tags: [Merchant - Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName, address, district, phone]
 *             properties:
 *               businessName: { type: string }
 *               businessType: { type: string }
 *               tradeLicense: { type: string }
 *               address: { type: string }
 *               district: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: "Application submitted" }
 */
router.post("/", verifyFBToken, async (req, res) => {
  try {
    const { businessName, businessType, tradeLicense, address, district, phone } = req.body;
    const email = req.user.email;

    if (!email) {
      return res.status(400).send({ success: false, message: "User email not found in token." });
    }

    // Check if already a merchant
    const existing = await merchantsCollection.findOne({ email });
    if (existing) {
      return res.status(400).send({ success: false, message: "A merchant application already exists for this email." });
    }

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found in system." });
    }

    const newMerchant: Merchant = {
      userId: user._id as ObjectId,
      email,
      businessName,
      businessType,
      tradeLicense,
      address,
      district,
      phone,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const result = await merchantsCollection.insertOne(newMerchant);
    res.status(201).send({ 
      success: true, 
      message: "Application submitted successfully and is pending approval.", 
      merchantId: result.insertedId 
    });
  } catch (error) {
    console.error("Merchant Application Error:", error);
    res.status(500).send({ success: false, message: "Failed to submit application." });
  }
});

/**
 * @swagger
 * /merchants/me:
 *   get:
 *     summary: Get My Merchant Profile
 *     tags: [Merchant - Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/me", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;
    const merchant = await merchantsCollection.findOne({ email });
    if (!merchant) {
      return res.status(404).send({ success: false, message: "Merchant profile not found." });
    }
    res.send({ success: true, data: merchant });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch merchant profile." });
  }
});

/**
 * @swagger
 * /merchants/stats:
 *   get:
 *     summary: Get My Business Performance Stats
 *     tags: [Merchant - Dashboard]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/stats", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;
    const merchant = await merchantsCollection.findOne({ email });
    if (!merchant) return res.status(404).send({ success: false, message: "Merchant not found" });

    const stats = await parcelCollection.aggregate([
      { $match: { merchantId: merchant._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalCODCollected: { 
            $sum: { $cond: [{ $eq: ["$delivery_status", "delivered"] }, "$codAmount", 0] } 
          },
          pendingCOD: {
            $sum: { $cond: [{ $ne: ["$delivery_status", "delivered"] }, "$codAmount", 0] }
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$delivery_status", "delivered"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    res.send({ success: true, stats: stats[0] || { totalBookings: 0, totalCODCollected: 0, pendingCOD: 0, deliveredCount: 0 } });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch merchant stats" });
  }
});

export default router;
