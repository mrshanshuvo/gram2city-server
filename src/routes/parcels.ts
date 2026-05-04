import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  parcelCollection,
  notificationsCollection,
  addTrackingUpdate,
  settingsCollection,
} from "../db";
import { verifyFBToken } from "../middleware/auth";
import { Parcel, SystemSettings } from "../types";

const router = Router();

/**
 * @swagger
 * /parcels:
 *   get:
 *     summary: Get my booked parcels (Customer only)
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: payment_status
 *         in: query
 *         schema: { type: string, enum: [paid, unpaid] }
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/parcels", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;
    const { payment_status, delivery_status } = req.query;

    const query: any = { created_by: email };
    if (payment_status) query.payment_status = payment_status;
    if (delivery_status) query.delivery_status = delivery_status;

    const parcels = await parcelCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send({ success: true, count: parcels.length, data: parcels });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch your parcels." });
  }
});

/**
 * @swagger
 * /parcels/stats:
 *   get:
 *     summary: Get my personal parcel stats and spending (Customer only)
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Stats retrieved" }
 */
router.get("/parcels/stats", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;

    const stats = await parcelCollection
      .aggregate([
        { $match: { created_by: email } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$cost" },
            totalParcels: { $sum: 1 },
            delivered: {
              $sum: {
                $cond: [{ $eq: ["$delivery_status", "delivered"] }, 1, 0],
              },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$delivery_status", "pending"] }, 1, 0] },
            },
            on_the_way: {
              $sum: {
                $cond: [{ $eq: ["$delivery_status", "on_the_way"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    res.send({
      success: true,
      stats: stats[0] || {
        totalSpent: 0,
        totalParcels: 0,
        delivered: 0,
        pending: 0,
        on_the_way: 0,
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to calculate stats." });
  }
});

/**
 * @swagger
 * /parcels:
 *   post:
 *     summary: Book a new parcel with dynamic cost calculation
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [parcelName, weight, receiverName, receiverPhone, deliveryAddress, receiverDistrict]
 *             properties:
 *               parcelName: { type: string, example: "Laptop" }
 *               parcelType: { type: string, example: "Electronics" }
 *               weight: { type: number, example: 2 }
 *               receiverName: { type: string, example: "John Doe" }
 *               receiverPhone: { type: string, example: "01700000000" }
 *               deliveryAddress: { type: string, example: "123 Street, Dhaka" }
 *               receiverDistrict: { type: string, example: "Dhaka" }
 *               senderPhone: { type: string, example: "01800000000" }
 *               deliveryDate: { type: string, format: date }
 *     responses:
 *       201: { description: "Parcel Booked" }
 */
router.post("/parcels", verifyFBToken, async (req, res) => {
  try {
    const {
      parcelName,
      parcelType,
      weight,
      receiverName,
      receiverPhone,
      deliveryAddress,
      receiverDistrict,
      senderPhone,
      deliveryDate,
    } = req.body;

    if (
      !parcelName ||
      !weight ||
      !receiverName ||
      !receiverPhone ||
      !deliveryAddress ||
      !receiverDistrict
    ) {
      return res
        .status(400)
        .send({ success: false, message: "Missing required fields." });
    }

    // 1. Fetch System Settings for cost calculation
    const settings = (await settingsCollection.findOne({})) as SystemSettings;
    const baseFee = settings?.base_delivery_fee || 50;
    const costPerKg = settings?.cost_per_kg || 20;
    const riderCommissionPct = settings?.rider_commission_percentage || 15;

    // 2. Intelligent Cost Calculation
    const weightNum = Number(weight);
    const totalCost =
      baseFee + (weightNum > 1 ? (weightNum - 1) * costPerKg : 0);
    const riderEarning = (totalCost * riderCommissionPct) / 100;
    const adminProfit = totalCost - riderEarning;

    // 3. Create Professional Parcel Object
    const trackingId = `G2C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newParcel: Parcel = {
      trackingId,
      parcelName,
      parcelType,
      created_by: req.user.email as string,
      creation_date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      weight: weightNum,
      receiverName,
      receiverPhone,
      deliveryAddress,
      receiverDistrict,
      senderPhone,
      deliveryDate,
      cost: totalCost,
      rider_earning: riderEarning,
      admin_profit: adminProfit,
      payment_status: "unpaid",
      delivery_status: "pending",
    };

    const result = await parcelCollection.insertOne(newParcel);

    // 4. Tracking & Notification
    await addTrackingUpdate(
      trackingId,
      "booked",
      "Your parcel has been booked and is awaiting collection.",
    );

    res.status(201).send({
      success: true,
      message: "Parcel booked successfully!",
      trackingId,
      cost: totalCost,
      id: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to book parcel." });
  }
});

/**
 * @swagger
 * /parcels/{id}:
 *   delete:
 *     summary: Cancel a parcel (Only if pending)
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Cancelled" }
 */
router.delete("/parcels/:id", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user.email;

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
    });

    if (!parcel)
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found." });

    // Security: Only owner can delete
    if (parcel.created_by !== email) {
      return res
        .status(403)
        .send({
          success: false,
          message: "Unauthorized to cancel this parcel.",
        });
    }

    // Business Logic: Can only cancel if pending
    if (parcel.delivery_status !== "pending") {
      return res
        .status(400)
        .send({
          success: false,
          message:
            "Cannot cancel a parcel that is already assigned or in transit.",
        });
    }

    await parcelCollection.deleteOne({ _id: new ObjectId(String(id)) });
    res.send({ success: true, message: "Parcel cancelled successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to cancel parcel." });
  }
});

export default router;
