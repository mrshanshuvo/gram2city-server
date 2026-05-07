import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  parcelCollection,
  notificationsCollection,
  addTrackingUpdate,
  settingsCollection,
  auditCollection,
} from "../db";
import { verifyFBToken } from "../middleware/auth";
import { Parcel, SystemSettings } from "../types";
import { io } from "../socket";
import { validate } from "../middleware/validate";
import { parcelSchema, updateParcelSchema } from "../schemas/parcelSchema";

const router = Router();

/**
 * @swagger
 * /parcels:
 *   get:
 *     summary: List My Booked Parcels
 *     tags: [Customer - Parcel Management]
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
 *     summary: Get My Parcel Statistics
 *     tags: [Customer - Parcel Management]
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
 *     summary: Book New Parcel
 *     tags: [Customer - Parcel Management]
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
 *       400: { description: "Validation failed or Missing fields" }
 */
router.post(
  "/parcels",
  verifyFBToken,
  validate(parcelSchema),
  async (req, res) => {
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
        requiredVehicle = "bike",
        merchantId,
        codAmount,
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

      // 2. Intelligent Cost Calculation with Vehicle Multiplier
      const vehicleMultipliers = {
        bike: 1,
        car: 1.5,
        mini_pickup: 2.2,
        large_pickup: 3.5,
      };
      const multiplier =
        vehicleMultipliers[requiredVehicle as keyof typeof vehicleMultipliers] ||
        1;

      const weightNum = Number(weight);
      const baseCost =
        baseFee + (weightNum > 1 ? (weightNum - 1) * costPerKg : 0);
      const totalCost = baseCost * multiplier;

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
        parcelWeight: weightNum, // Alias for frontend
        receiverName,
        receiverPhone,
        receiverPhoneNumber: receiverPhone, // Alias for frontend
        deliveryAddress,
        receiverDistrict,
        receiverRegion: receiverDistrict, // Alias for frontend
        senderPhone,
        senderContact: senderPhone, // Alias for frontend
        senderDistrict: req.body.senderDistrict || "",
        senderRegion: req.body.senderDistrict || "", // Alias for frontend
        senderName: req.body.senderName || req.user.name || "Anonymous",
        deliveryDate,
        cost: totalCost,
        rider_earning: riderEarning,
        admin_profit: adminProfit,
        payment_status: "unpaid",
        delivery_status: "pending",
        // Multi-Role Support
        requiredVehicle: requiredVehicle as any,
        merchantId: merchantId ? new ObjectId(String(merchantId)) : undefined,
        codAmount: codAmount ? Number(codAmount) : undefined,
      };

      const result = await parcelCollection.insertOne(newParcel);

      // 4. Tracking & Notification
      await addTrackingUpdate(
        trackingId,
        "booked",
        "Your parcel has been booked and is awaiting collection.",
      );

      // 5. Broadcast to Admins
      if (io) {
        io.emit("new_parcel", {
          trackingId,
          sender: newParcel.senderName,
          destination: newParcel.receiverDistrict,
          cost: totalCost,
        });
      }

      res.status(201).send({
        success: true,
        message: "Parcel booked successfully!",
        trackingId,
        cost: totalCost,
        id: result.insertedId,
      });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: "Failed to book parcel." });
    }
  },
);

/**
 * @swagger
 * /parcels/{id}:
 *   get:
 *     summary: Get Parcel Details
 *     tags: [Customer - Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/parcels/:id", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.user.email;

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
    });

    if (!parcel) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found." });
    }

    if (parcel.created_by !== email && req.user.role !== "admin") {
      return res
        .status(403)
        .send({ success: false, message: "Unauthorized access." });
    }

    res.send({ success: true, data: parcel });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch parcel." });
  }
});

/**
 * @swagger
 * /parcels/{id}:
 *   patch:
 *     summary: Update Parcel Details
 *     tags: [Customer - Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Updated" }
 *       400: { description: "Validation failed or Parcel not in transit" }
 */
router.patch(
  "/parcels/:id",
  verifyFBToken,
  validate(updateParcelSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const email = req.user.email;
      const updateData = req.body;

      const parcel = await parcelCollection.findOne({
        _id: new ObjectId(String(id)),
      });

      if (!parcel) {
        return res
          .status(404)
          .send({ success: false, message: "Parcel not found." });
      }

      if (parcel.created_by !== email) {
        return res
          .status(403)
          .send({ success: false, message: "Unauthorized." });
      }

      if (parcel.delivery_status !== "pending") {
        return res.status(400).send({
          success: false,
          message: "Cannot update a parcel that is already in transit.",
        });
      }

      // Recalculate cost if weight changed
      if (updateData.weight) {
        const settings = (await settingsCollection.findOne(
          {},
        )) as SystemSettings;
        const baseFee = settings?.base_delivery_fee || 50;
        const costPerKg = settings?.cost_per_kg || 20;
        const riderCommissionPct = settings?.rider_commission_percentage || 15;

        const weightNum = Number(updateData.weight);
        const totalCost =
          baseFee + (weightNum > 1 ? (weightNum - 1) * costPerKg : 0);
        const riderEarning = (totalCost * riderCommissionPct) / 100;
        const adminProfit = totalCost - riderEarning;

        updateData.cost = totalCost;
        updateData.rider_earning = riderEarning;
        updateData.admin_profit = adminProfit;
        updateData.parcelWeight = weightNum; // Sync alias
      }

      // Map other aliases if present
      if (updateData.receiverPhone)
        updateData.receiverPhoneNumber = updateData.receiverPhone;
      if (updateData.receiverDistrict)
        updateData.receiverRegion = updateData.receiverDistrict;

      await parcelCollection.updateOne(
        { _id: new ObjectId(String(id)) },
        { $set: updateData },
      );

      res.send({ success: true, message: "Parcel updated successfully." });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: "Failed to update parcel." });
    }
  },
);

/**
 * @swagger
 * /parcels/{id}:
 *   delete:
 *     summary: Delete/Cancel Parcel
 *     tags: [Customer - Parcel Management]
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
      return res.status(403).send({
        success: false,
        message: "Unauthorized to cancel this parcel.",
      });
    }

    // Business Logic: Can only cancel if pending
    if (parcel.delivery_status !== "pending") {
      return res.status(400).send({
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

/**
 * @swagger
 * /parcels/{id}/pick:
 *   patch:
 *     summary: Mark Parcel as Picked Up
 *     tags: [Rider - Logistics Operations]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Picked up" }
 */
router.patch("/parcels/:id/pick", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { addTrackingUpdate } = require("../db");

    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          delivery_status: "on_the_way",
          picked_at: new Date().toISOString(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found" });
    }

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
    });
    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "on_the_way",
        "Parcel has been picked up and is on the way.",
        "Pickup Point",
      );
    }

    res.send({ success: true, message: "Parcel picked up successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to mark as picked" });
  }
});

/**
 * @swagger
 * /parcels/bulk:
 *   post:
 *     summary: Bulk Ingest Parcels (Merchant Feature)
 *     tags: [Merchant - Logistics]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parcels]
 *             properties:
 *               parcels: { type: array, items: { type: object } }
 *     responses:
 *       201: { description: "Parcels Ingested" }
 */
router.post("/parcels/bulk", verifyFBToken, async (req, res) => {
  try {
    const { parcels, merchantId } = req.body;
    if (!Array.isArray(parcels)) return res.status(400).send({ success: false, message: "Invalid data format" });

    const newParcels = parcels.map((p: any) => ({
      trackingId: `G2C-B-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      parcelName: p.parcelName || "Bulk Item",
      parcelType: p.parcelType || "Package",
      created_by: req.user.email as string,
      creation_date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      weight: Number(p.weight) || 1,
      parcelWeight: Number(p.weight) || 1,
      receiverName: p.receiverName,
      receiverPhone: p.receiverPhone,
      receiverPhoneNumber: p.receiverPhone,
      deliveryAddress: p.deliveryAddress,
      receiverDistrict: p.receiverDistrict,
      receiverRegion: p.receiverDistrict,
      senderName: req.user.name || "Merchant",
      senderPhone: p.senderPhone || "",
      cost: Number(p.cost) || 50,
      payment_status: "unpaid" as const,
      delivery_status: "pending" as const,
      merchantId: merchantId ? new ObjectId(String(merchantId)) : undefined,
      codAmount: Number(p.codAmount) || 0,
    } as Parcel));

    await parcelCollection.insertMany(newParcels);
    
    // Log audit
    await auditCollection.insertOne({
      admin_email: req.user.email,
      action: "BULK_PARCEL_INGEST",
      details: `Merchant ${req.user.email} uploaded ${newParcels.length} parcels.`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).send({ success: true, message: `${newParcels.length} parcels uploaded successfully.` });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to process bulk upload" });
  }
});

/**
 * @swagger
 * /parcels/{id}/deliver:
 *   patch:
 *     summary: Mark Parcel as Delivered
 *     tags: [Rider - Logistics Operations]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Delivered" }
 */
router.patch("/parcels/:id/deliver", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { addTrackingUpdate } = require("../db");

    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          delivery_status: "delivered",
          delivered_at: new Date().toISOString(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found" });
    }

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
    });
    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "delivered",
        "Parcel has been successfully delivered to the recipient.",
        parcel.receiverDistrict,
      );
    }

    res.send({ success: true, message: "Parcel delivered successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to mark as delivered" });
  }
});

export default router;
