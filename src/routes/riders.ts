import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  ridersCollection,
  parcelCollection,
  cashoutsCollection,
  notificationsCollection,
  addTrackingUpdate,
  settingsCollection,
} from "../db";
import { verifyFBToken } from "../middleware/auth";
import { Rider, SystemSettings, Parcel } from "../types";

const router = Router();

/**
 * @swagger
 * /riders:
 *   get:
 *     summary: List all riders (Admin only)
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [available, pending, approved] }
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/riders", verifyFBToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status === "available") {
      query.status = "approved"; // Only approved riders can be available
      // query.is_available = true; // Optional: if you track real-time availability
    } else if (status) {
      query.status = status;
    }

    const riders = await ridersCollection.find(query).toArray();
    res.send(riders);
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch riders" });
  }
});

/**
 * @swagger
 * /rider/parcels:
 *   get:
 *     summary: Get parcels assigned to me (Rider only)
 *     tags: [Rider Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/rider/parcels", verifyFBToken, async (req, res) => {
  try {
    const riderEmail = req.user.email;
    const rider = await ridersCollection.findOne({ email: riderEmail });

    if (!rider)
      return res
        .status(404)
        .send({ success: false, message: "Rider profile not found." });

    const parcels = await parcelCollection
      .find({
        assigned_rider_id: new ObjectId(String(rider._id)),
        delivery_status: { $in: ["assigned", "on_the_way", "delivered"] },
      })
      .sort({ creation_date: -1 })
      .toArray();

    res.send({ success: true, count: parcels.length, data: parcels });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch assigned parcels." });
  }
});

/**
 * @swagger
 * /rider/parcels/{id}/status:
 *   patch:
 *     summary: Update parcel delivery status (Rider only)
 *     tags: [Rider Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [delivery_status]
 *             properties:
 *               delivery_status: { type: string, enum: [on_the_way, delivered, cancelled] }
 *     responses:
 *       200: { description: "Status Updated" }
 */
router.patch("/rider/parcels/:id/status", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;
    const riderEmail = req.user.email;

    const rider = await ridersCollection.findOne({ email: riderEmail });
    if (!rider)
      return res
        .status(404)
        .send({ success: false, message: "Rider not found." });

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
      assigned_rider_id: rider._id,
    });

    if (!parcel)
      return res
        .status(404)
        .send({ success: false, message: "Parcel not assigned to you." });

    const updateFields: any = { delivery_status };

    if (delivery_status === "delivered") {
      updateFields.delivered_at = new Date().toISOString();

      // Update Rider Performance Metrics
      await ridersCollection.updateOne(
        { _id: rider._id },
        { $inc: { total_delivered: 1 } },
      );
    }

    await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateFields },
    );

    // Tracking & Notifications
    const statusMsg =
      delivery_status === "delivered"
        ? "delivered successfully"
        : "now on the way";
    await addTrackingUpdate(
      parcel.trackingId,
      delivery_status,
      `Parcel has been ${statusMsg}.`,
    );

    notificationsCollection.insertOne({
      email: parcel.created_by,
      message: `Status Update: Your parcel "${parcel.parcelName}" is ${statusMsg}!`,
      time: new Date().toISOString(),
      isRead: false,
      type: "status_update",
    });

    res.send({
      success: true,
      message: `Status updated to ${delivery_status}.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update status." });
  }
});

/**
 * @swagger
 * /rider/reviews:
 *   get:
 *     summary: See all reviews and ratings left for me (Rider only)
 *     tags: [Rider Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/reviews", verifyFBToken, async (req, res) => {
  try {
    const { reviewsCollection } = require("../db");
    const email = req.user.email;

    const reviews = await reviewsCollection
      .find({ rider_email: email })
      .sort({ date: -1 })
      .toArray();

    res.send({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch reviews." });
  }
});

/**
 * @swagger
 * /rider/stats:
 *   get:
 *     summary: Get my delivery performance and earnings
 *     tags: [Rider Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Stats retrieved" }
 */
router.get("/rider/stats", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;

    const deliveryStats = await parcelCollection
      .aggregate([
        {
          $match: { assigned_rider_email: email, delivery_status: "delivered" },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$rider_earning" },
            totalDelivered: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const rider = await ridersCollection.findOne({ email });

    res.send({
      success: true,
      stats: {
        totalEarnings: deliveryStats[0]?.totalEarnings || 0,
        totalDelivered:
          rider?.total_delivered || deliveryStats[0]?.totalDelivered || 0,
        averageRating: rider?.average_rating || 0,
      },
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch stats." });
  }
});

export default router;
