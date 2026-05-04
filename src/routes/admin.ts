import { Router } from "express";
import { usersCollection, auditCollection, settingsCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import { AuditLog, SystemSettings } from "../types";

const router = Router();

// Apply Admin security to ALL routes in this file
router.use(verifyFBToken, verifyAdmin);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: View administrative audit logs
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await auditCollection
      .find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.send({ success: true, logs });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch logs" });
  }
});

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get high-level platform statistics and revenue data
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Stats retrieved" }
 */
router.get("/stats", async (req, res) => {
  try {
    const {
      parcelCollection,
      paymentCollection,
      ridersCollection,
    } = require("../db");

    // 1. Parcel Stats
    const totalParcels = await parcelCollection.countDocuments();
    const pendingParcels = await parcelCollection.countDocuments({
      delivery_status: { $in: ["pending", "assigned", "not_collected", "picked_up"] },
    });
    const deliveredParcels = await parcelCollection.countDocuments({
      delivery_status: "delivered",
    });

    // 2. Financial Stats (Aggregation)
    const revenueData = await paymentCollection
      .aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$amount" } } }])
      .toArray();

    const profitData = await parcelCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalProfit: {
              $sum: { $ifNull: ["$admin_profit", { $multiply: ["$cost", 0.85] }] },
            },
          },
        },
      ])
      .toArray();

    // 3. User Stats
    const totalUsers = await usersCollection.countDocuments({ role: "user" });
    const totalRiders = await ridersCollection.countDocuments();

    res.send({
      success: true,
      stats: {
        parcels: {
          total: totalParcels,
          pending: pendingParcels,
          delivered: deliveredParcels,
        },
        revenue: revenueData[0]?.totalRevenue || 0,
        profit: profitData[0]?.totalProfit || 0,
        users: { customers: totalUsers, riders: totalRiders },
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to aggregate stats" });
  }
});

/**
 * @swagger
 * /admin/announce:
 *   post:
 *     summary: Send a notification to all users and riders
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: "System maintenance tonight at 2 AM." }
 *     responses:
 *       200: { description: "Announcement sent" }
 */
router.post("/announce", async (req, res) => {
  const { message } = req.body;
  try {
    const { notificationsCollection } = require("../db");

    // Fetch all user emails
    const users = await usersCollection
      .find({}, { projection: { email: 1 } })
      .toArray();

    const notifications = users.map((u) => ({
      email: u.email,
      message: `ANNOUNCEMENT: ${message}`,
      time: new Date().toISOString(),
      isRead: false,
      type: "admin_alert",
    }));

    if (notifications.length > 0) {
      await notificationsCollection.insertMany(notifications);
    }

    // Log the announcement
    await auditCollection.insertOne({
      admin_email: req.user.email,
      action: "BULK_ANNOUNCEMENT",
      details: `Sent announcement: ${message}`,
      timestamp: new Date().toISOString(),
    });

    res.send({
      success: true,
      message: `Announcement sent to ${users.length} users.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to send announcement" });
  }
});

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get global system settings
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/settings", async (req, res) => {
  try {
    let settings = await settingsCollection.findOne({});

    if (!settings) {
      const defaultSettings: SystemSettings = {
        base_delivery_fee: 50,
        cost_per_kg: 20,
        rider_commission_percentage: 15,
        updated_at: new Date().toISOString(),
        updated_by: "system",
      };
      await settingsCollection.insertOne(defaultSettings);
      settings = defaultSettings;
    }

    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /admin/settings:
 *   patch:
 *     summary: Update global system settings
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               base_delivery_fee: { type: number, example: 50 }
 *               cost_per_kg: { type: number, example: 20 }
 *               rider_commission_percentage: { type: number, example: 15 }
 *     responses:
 *       200: { description: "Settings updated" }
 */
router.patch("/settings", async (req, res) => {
  const { base_delivery_fee, cost_per_kg, rider_commission_percentage } =
    req.body;
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: req.user.email,
    };

    if (base_delivery_fee)
      updateData.base_delivery_fee = Number(base_delivery_fee);
    if (cost_per_kg) updateData.cost_per_kg = Number(cost_per_kg);
    if (rider_commission_percentage)
      updateData.rider_commission_percentage = Number(
        rider_commission_percentage,
      );

    await settingsCollection.updateOne(
      {},
      { $set: updateData },
      { upsert: true },
    );

    const log: AuditLog = {
      admin_email: req.user.email as string,
      action: "UPDATE_SETTINGS",
      details: `Updated system settings: ${JSON.stringify(updateData)}`,
      timestamp: new Date().toISOString(),
    };
    await auditCollection.insertOne(log);

    res.send({ success: true, message: "Settings updated and logged." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update settings" });
  }
});

/**
 * @swagger
 * /admin/users/{email}/status:
 *   patch:
 *     summary: Suspend or activate a user account
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, suspended] }
 *     responses:
 *       200: { description: "User status updated" }
 */
router.patch("/users/:email/status", async (req, res) => {
  const { email } = req.params;
  const { status } = req.body;
  try {
    await usersCollection.updateOne({ email }, { $set: { status } });

    const log: AuditLog = {
      admin_email: req.user.email as string,
      action: "USER_STATUS_CHANGE",
      target_id: email,
      details: `Changed user ${email} status to ${status}`,
      timestamp: new Date().toISOString(),
    };
    await auditCollection.insertOne(log);

    res.send({
      success: true,
      message: `User account ${status} successfully.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update user status" });
  }
});

/**
 * @swagger
 * /admin/all-parcels:
 *   get:
 *     summary: Manage all platform parcels (Admin only)
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: string, default: "1" }
 *       - name: size
 *         in: query
 *         schema: { type: string, default: "10" }
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/all-parcels", async (req, res) => {
  try {
    const { parcelCollection } = require("../db");
    const { delivery_status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const skip = (page - 1) * size;

    const query: any = {};
    if (delivery_status && delivery_status !== "all") {
      query.delivery_status = delivery_status;
    }
    if (startDate || endDate) {
      query.creation_date = {};
      if (startDate) query.creation_date.$gte = new Date(startDate as string).toISOString();
      if (endDate) query.creation_date.$lte = new Date(endDate as string).toISOString();
    }

    const parcels = await parcelCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    const totalCount = await parcelCollection.countDocuments();

    res.send({
      success: true,
      parcels: parcels,
      total: totalCount,
      page,
      size,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch all parcels" });
  }
});

/**
 * @swagger
 * /parcels/{id}/assign:
 *   patch:
 *     summary: Assign a rider to a parcel (Admin only)
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [riderId]
 *             properties:
 *               riderId: { type: string, example: "60d...123" }
 *     responses:
 *       200: { description: "Rider Assigned" }
 */
router.patch("/parcels/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { riderId } = req.body;
  try {
    const { parcelCollection, ridersCollection, addTrackingUpdate } = require("../db");
    const { ObjectId } = require("mongodb");

    const rider = await ridersCollection.findOne({ _id: new ObjectId(String(riderId)) });
    if (!rider) return res.status(404).send({ success: false, message: "Rider not found" });

    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          assigned_rider_id: rider._id,
          assigned_rider_name: rider.name,
          assigned_rider_email: rider.email,
          assigned_rider_phone: rider.phone,
          delivery_status: "assigned",
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ success: false, message: "Parcel not found or already updated" });
    }

    // Add tracking update
    const parcel = await parcelCollection.findOne({ _id: new ObjectId(String(id)) });
    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "assigned",
        `Parcel assigned to rider ${rider.name}`,
        "Admin Dashboard"
      );
    }

    res.send({ success: true, message: "Rider assigned successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to assign rider" });
  }
});

export default router;
