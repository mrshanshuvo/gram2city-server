import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  parcelCollection,
  notificationsCollection,
  addTrackingUpdate,
} from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";

const router = Router();

// GET /parcels  (all or filtered by user/status)
router.get("/parcels", verifyFBToken, async (req, res) => {
  try {
    const email = req.query.email as string | undefined;
    const payment_status = req.query.payment_status as string | undefined;
    const delivery_status = req.query.delivery_status as string | undefined;
    const query: Record<string, unknown> = {};
    if (email) query["created_by"] = email;
    if (payment_status) query["payment_status"] = payment_status;
    if (delivery_status) query["delivery_status"] = delivery_status;
    const parcels = await parcelCollection
      .find(query)
      .sort({ createdAt: -1 as const })
      .toArray();
    res.send(parcels);
  } catch {
    res.status(500).send({ message: "Failed to get parcels" });
  }
});

// GET /parcels/delivery/status-count  (must be before /:id)
router.get("/parcels/delivery/status-count", async (_req, res) => {
  try {
    const result = await parcelCollection
      .aggregate([
        { $group: { _id: "$delivery_status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ])
      .toArray();
    res.send(result);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /parcels/:id
router.get("/parcels/:id", async (req, res) => {
  try {
    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(req.params.id as string),
    });
    if (!parcel)
      return res.status(404).send({ success: false, message: "Parcel not found" });
    res.send({ success: true, data: parcel });
  } catch {
    res.status(500).send({ success: false, message: "Failed to fetch parcel" });
  }
});

// POST /parcels
router.post("/parcels", verifyFBToken, async (req, res) => {
  try {
    const parcelData = req.body;
    const result = await parcelCollection.insertOne(parcelData);
    await addTrackingUpdate(
      parcelData.trackingId,
      "booked",
      "Your parcel has been booked and is awaiting collection.",
    );
    res.status(201).send({ success: true, message: "Parcel created successfully", data: result });
  } catch {
    res.status(500).send({ success: false, message: "Failed to create parcel" });
  }
});

// DELETE /parcels/:id
router.delete("/parcels/:id", verifyFBToken, async (req, res) => {
  try {
    const result = await parcelCollection.deleteOne({
      _id: new ObjectId(req.params.id as string),
    });
    res.send(result);
  } catch {
    res.status(500).send({ success: false, message: "Failed to delete parcel" });
  }
});

// PATCH /parcels/:id/pick  (rider picks up parcel)
router.patch("/parcels/:id/pick", verifyFBToken, async (req, res) => {
  try {
    const parcelId = req.params.id as string;
    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { picked_at: new Date().toISOString(), delivery_status: "on_the_way" } },
    );
    if (result.modifiedCount === 0)
      return res.status(404).send({ success: false, message: "Parcel not found or already picked" });

    res.send({ success: true, message: "Parcel marked as picked" });

    const parcel = await parcelCollection.findOne({ _id: new ObjectId(parcelId) });
    if (parcel) {
      notificationsCollection.insertOne({
        email: parcel.created_by,
        message: `Your parcel "${parcel.parcelName}" has been picked up by the rider and is on the way!`,
        time: new Date().toISOString(),
        isRead: false,
        type: "status_update",
      });
      await addTrackingUpdate(
        parcel.trackingId,
        "picked_up",
        `The rider has picked up the parcel from ${parcel.senderAddress}.`,
        parcel.senderServiceCenter,
      );
    }
  } catch {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

// PATCH /parcels/:id/assign  (admin assigns rider)
router.patch(
  "/parcels/:id/assign",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const parcelId = req.params.id as string;
      const { riderId } = req.body;

      const { ridersCollection } = await import("../db");
      const rider = await ridersCollection.findOne({ _id: new ObjectId(riderId as string) });
      if (!rider)
        return res.status(404).send({ success: false, message: "Rider not found" });

      const result = await parcelCollection.updateOne(
        { _id: new ObjectId(parcelId) },
        {
          $set: {
            assigned_rider_id: new ObjectId(riderId as string),
            assigned_rider_name: rider.name,
            assigned_rider_email: rider.email,
            assigned_rider_phone: rider.phone,
            delivery_status: "assigned",
          },
        },
      );

      res.send({ success: true, message: "Rider assigned successfully", data: result });

      const parcel = await parcelCollection.findOne({ _id: new ObjectId(parcelId) });
      if (parcel) {
        notificationsCollection.insertOne({
          email: parcel.created_by,
          message: `A rider (${rider.name}) has been assigned to your parcel "${parcel.parcelName}".`,
          time: new Date().toISOString(),
          isRead: false,
          type: "status_update",
        });
        notificationsCollection.insertOne({
          email: rider.email,
          message: `You have been assigned a new delivery: "${parcel.parcelName}".`,
          time: new Date().toISOString(),
          isRead: false,
          type: "status_update",
        });
        await addTrackingUpdate(parcel.trackingId, "assigned", `Rider assigned: ${rider.name}.`);
      }
    } catch {
      res.status(500).send({ success: false, message: "Internal server error" });
    }
  },
);

// GET /admin/stats
router.get("/admin/stats", verifyFBToken, verifyAdmin, async (_req, res) => {
  try {
    const totalRevenueResult = await (await import("../db")).paymentCollection
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray();
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const dailyBookings = await parcelCollection
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$creation_date" } } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 7 },
      ])
      .toArray();

    const parcelTypeDistribution = await parcelCollection
      .aggregate([{ $group: { _id: "$parcelType", count: { $sum: 1 } } }])
      .toArray();

    res.send({ totalRevenue, dailyBookings, parcelTypeDistribution });
  } catch {
    res.status(500).send({ error: "Failed to fetch admin stats" });
  }
});

// GET /admin/all-parcels  (paginated + filtered)
router.get("/admin/all-parcels", verifyFBToken, verifyAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;
  const status = req.query.status as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const query: Record<string, unknown> = {};
  if (status && status !== "all") query["delivery_status"] = status;
  if (startDate && endDate) query["creation_date"] = { $gte: startDate, $lte: endDate };

  try {
    const parcels = await parcelCollection
      .find(query)
      .skip((page - 1) * size)
      .limit(size)
      .sort({ creation_date: -1 })
      .toArray();
    const total = await parcelCollection.countDocuments(query);
    res.send({ parcels, total });
  } catch {
    res.status(500).send({ error: "Failed to fetch all parcels" });
  }
});

export default router;
