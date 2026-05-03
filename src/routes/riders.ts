import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  ridersCollection,
  parcelCollection,
  cashoutsCollection,
  reviewsCollection,
  notificationsCollection,
  usersCollection,
  addTrackingUpdate,
} from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import type { User } from "../types";

const router = Router();

// GET /riders/pending
router.get("/riders/pending", verifyFBToken, verifyAdmin, async (_req, res) => {
  try {
    const pendingRiders = await ridersCollection.find({ status: "pending" }).toArray();
    res.send(pendingRiders);
  } catch (error) {
    console.error("Error fetching pending riders:", (error as Error).message);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /riders/approved
router.get("/riders/approved", verifyFBToken, verifyAdmin, async (_req, res) => {
  try {
    const approvedRiders = await ridersCollection.find({ status: "approved" }).toArray();
    res.json(approvedRiders);
  } catch {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /riders?status=available
router.get("/riders", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query: Record<string, unknown> = {};
    if (status === "available") query = { status: "approved" };
    else if (status) query = { status };
    const riders = await ridersCollection
      .find(query)
      .project({ _id: 1, name: 1, phone: 1, district: 1, region: 1 })
      .toArray();
    res.send(riders);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// POST /riders
router.post("/riders", verifyFBToken, verifyAdmin, async (req, res) => {
  const rider = req.body;
  const result = await ridersCollection.insertOne(rider);
  res.send(result);
});

// PATCH /riders/:id/status
router.patch(
  "/riders/:id/status",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { status, email } = req.body;
    try {
      const result = await ridersCollection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { status } },
      );
      if (status === "approved") {
        const userResult = await usersCollection.updateOne(
          { email },
          { $set: { role: "rider" as User["role"] } },
        );
        console.log("User role updated:", userResult.modifiedCount);
      }
      res.send(result);
    } catch {
      res.status(500).send({ error: "Internal Server Error" });
    }
  },
);

// GET /rider/parcels  (rider's own assigned parcels)
router.get("/rider/parcels", verifyFBToken, async (req, res) => {
  try {
    const riderEmail = req.user.email;
    const rider = await ridersCollection.findOne({ email: riderEmail });
    if (!rider)
      return res.status(404).send({ success: false, message: "Rider not found" });

    const assignedParcels = await parcelCollection
      .find({
        assigned_rider_id: new ObjectId(rider._id),
        delivery_status: { $in: ["on_the_way", "delivered", "assigned"] },
      })
      .sort({ creation_date: -1 })
      .toArray();

    res.send({ success: true, data: assignedParcels });
  } catch {
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// PATCH /rider/parcels/:id/status
router.patch("/rider/parcels/:id/status", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;
    const riderEmail = req.user.email;

    const rider = await ridersCollection.findOne({ email: riderEmail });
    if (!rider)
      return res.status(404).send({ success: false, message: "Rider not found" });

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(id as string),
      assigned_rider_id: new ObjectId(rider._id),
    });
    if (!parcel)
      return res.status(404).send({ success: false, message: "Parcel not found or not assigned to you" });

    const updateFields: Record<string, unknown> = { delivery_status };
    if (delivery_status === "delivered") {
      updateFields["delivered_at"] = new Date().toISOString();
      const isSameDistrict = parcel.senderDistrict === parcel.receiverDistrict;
      updateFields["rider_earning"] = (parcel.cost as number) * (isSameDistrict ? 0.8 : 0.3);
    }

    await parcelCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: updateFields },
    );

    res.send({ success: true, message: "Status updated successfully" });

    if (delivery_status === "delivered") {
      await addTrackingUpdate(parcel.trackingId, "delivered", "Parcel has been delivered successfully.", parcel.receiverServiceCenter);
      notificationsCollection.insertOne({
        email: parcel.created_by,
        message: `Hooray! Your parcel "${parcel.parcelName}" has been delivered.`,
        time: new Date().toISOString(),
        isRead: false,
        type: "status_update",
      });
    } else if (delivery_status === "on_the_way") {
      await addTrackingUpdate(parcel.trackingId, "on_the_way", "Parcel is on the way for delivery.", parcel.receiverServiceCenter);
      notificationsCollection.insertOne({
        email: parcel.created_by,
        message: `Your parcel "${parcel.parcelName}" is now on the way!`,
        time: new Date().toISOString(),
        isRead: false,
        type: "status_update",
      });
    }
  } catch {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

// GET /rider/stats/:email
router.get("/rider/stats/:email", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  try {
    const deliveryStats = await parcelCollection
      .aggregate([
        { $match: { assigned_rider_email: email, delivery_status: "delivered" } },
        { $group: { _id: null, totalDelivered: { $sum: 1 }, totalEarnings: { $sum: "$rider_earning" } } },
      ])
      .toArray();

    const avgRatingResult = await reviewsCollection
      .aggregate([
        { $match: { rider_email: email } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ])
      .toArray();

    res.send({
      totalDelivered: deliveryStats[0]?.totalDelivered || 0,
      totalEarnings: deliveryStats[0]?.totalEarnings || 0,
      avgRating: avgRatingResult[0]?.avgRating || 0,
    });
  } catch {
    res.status(500).send({ error: "Failed to fetch rider stats" });
  }
});

// POST /rider/cashout
router.post("/rider/cashout", verifyFBToken, async (req, res) => {
  try {
    const { parcelId } = req.body;
    const riderEmail = req.user.email;

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(parcelId as string),
      assigned_rider_email: riderEmail,
      delivery_status: "delivered",
    });
    if (!parcel)
      return res.status(404).send({ success: false, message: "Parcel not found or not delivered" });

    const alreadyCashedOut = await cashoutsCollection.findOne({ parcel_id: parcel._id });
    if (alreadyCashedOut)
      return res.status(400).send({ success: false, message: "Already cashed out" });

    await cashoutsCollection.insertOne({
      parcel_id: parcel._id!,
      rider_email: riderEmail!,
      rider_name: parcel.assigned_rider_name,
      earning: parcel.rider_earning ?? 0,
      cashed_out_at: new Date().toISOString(),
      trackingId: parcel.trackingId,
      parcel_name: parcel.parcelName,
    });

    res.send({ success: true, message: "Cash out successful" });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

export default router;
