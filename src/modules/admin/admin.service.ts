import { ObjectId } from "mongodb";
import {
  usersCollection,
  auditCollection,
  settingsCollection,
  merchantsCollection,
  parcelCollection,
  paymentCollection,
  ridersCollection,
  cashoutsCollection,
  notificationsCollection,
  addTrackingUpdate,
} from "../../db/db";
import { createNotification } from "../notification/notification.controller";
import { AuditLog, SystemSettings } from "./admin.interface";

export class AdminService {
  static async getAuditLogs(): Promise<AuditLog[]> {
    return (await auditCollection
      .find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()) as unknown as AuditLog[];
  }

  static async getStats() {
    // 1. Parcel Stats
    const totalParcels = await parcelCollection.countDocuments();
    const pendingParcels = await parcelCollection.countDocuments({
      delivery_status: {
        $in: ["pending", "assigned", "not_collected", "picked_up"],
      },
    });
    const onTheWayParcels = await parcelCollection.countDocuments({
      delivery_status: "on_the_way",
    });
    const deliveredParcels = await parcelCollection.countDocuments({
      delivery_status: "delivered",
    });
    const cancelledParcels = await parcelCollection.countDocuments({
      delivery_status: "cancelled",
    });
    const returnedParcels = await parcelCollection.countDocuments({
      delivery_status: "returned",
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
              $sum: {
                $ifNull: ["$admin_profit", { $multiply: ["$cost", 0.85] }],
              },
            },
          },
        },
      ])
      .toArray();

    // 3. User Stats
    const totalUsers = await usersCollection.countDocuments({ role: "user" });
    const totalRiders = await ridersCollection.countDocuments();

    // 4. Daily Bookings (Last 7 Days - Comprehensive)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookingsRaw = await parcelCollection
      .aggregate([
        {
          $match: {
            $or: [
              { creation_date: { $gte: sevenDaysAgo.toISOString() } },
              { createdAt: { $gte: sevenDaysAgo.toISOString() } },
            ],
          },
        },
        {
          $group: {
            _id: {
              $substr: [{ $ifNull: ["$creation_date", "$createdAt"] }, 0, 10],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const dailyBookings = last7Days.map((date) => ({
      _id: date,
      count: bookingsRaw.find((b: any) => b._id === date)?.count || 0,
    }));

    // 5. Parcel Type Distribution
    const typeDistribution = await parcelCollection
      .aggregate([{ $group: { _id: "$parcelType", count: { $sum: 1 } } }])
      .toArray();

    // 6. Average Delivery Time (in hours)
    const deliveryTimeData = await parcelCollection
      .aggregate([
        {
          $match: {
            delivery_status: "delivered",
            delivered_at: { $exists: true },
          },
        },
        {
          $project: {
            duration: {
              $divide: [
                {
                  $subtract: [
                    { $toDate: "$delivered_at" },
                    { $toDate: { $ifNull: ["$creation_date", "$createdAt"] } },
                  ],
                },
                3600000, // Convert ms to hours
              ],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: "$duration" } } },
      ])
      .toArray();

    // 7. Rider Leaderboard (Top 5 by Deliveries)
    const riderLeaderboard = await parcelCollection
      .aggregate([
        {
          $match: {
            delivery_status: "delivered",
            assigned_rider_id: { $exists: true },
          },
        },
        {
          $group: {
            _id: "$assigned_rider_id",
            deliveredCount: { $sum: 1 },
            avgRating: { $first: "$assigned_rider_rating" },
          },
        },
        {
          $lookup: {
            from: "riders",
            localField: "_id",
            foreignField: "_id",
            as: "riderDetails",
          },
        },
        { $unwind: "$riderDetails" },
        {
          $project: {
            name: "$riderDetails.name",
            email: "$riderDetails.email",
            deliveredCount: 1,
            rating: { $ifNull: ["$riderDetails.average_rating", 0] },
          },
        },
        { $sort: { deliveredCount: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    // 8. Geographic Distribution (by District)
    const districtDistribution = await parcelCollection
      .aggregate([
        { $group: { _id: "$receiverDistrict", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // 9. Fleet Distribution (by Vehicle Type)
    const fleetDistribution = await ridersCollection
      .aggregate([{ $group: { _id: "$vehicleType", count: { $sum: 1 } } }])
      .toArray();

    return {
      parcels: {
        total: totalParcels,
        pending: pendingParcels,
        onTheWay: onTheWayParcels,
        delivered: deliveredParcels,
        cancelled: cancelledParcels,
        returned: returnedParcels,
      },
      revenue: revenueData[0]?.totalRevenue || 0,
      profit: profitData[0]?.totalProfit || 0,
      users: { customers: totalUsers, riders: totalRiders },
      dailyBookings,
      parcelTypeDistribution: typeDistribution,
      avgDeliveryTime: deliveryTimeData[0]?.avgHours || 0,
      riderLeaderboard,
      districtDistribution,
      fleetDistribution,
    };
  }

  static async createAnnouncement(
    message: string,
    adminEmail: string,
  ): Promise<number> {
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

    await auditCollection.insertOne({
      admin_email: adminEmail,
      action: "BULK_ANNOUNCEMENT",
      details: `Sent announcement: ${message}`,
      timestamp: new Date().toISOString(),
    });

    return users.length;
  }

  static async getSettings(): Promise<SystemSettings> {
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

    return settings as unknown as SystemSettings;
  }

  static async updateSettings(
    data: {
      base_delivery_fee?: number;
      cost_per_kg?: number;
      rider_commission_percentage?: number;
    },
    adminEmail: string,
  ): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: adminEmail,
    };

    if (data.base_delivery_fee !== undefined)
      updateData.base_delivery_fee = Number(data.base_delivery_fee);
    if (data.cost_per_kg !== undefined)
      updateData.cost_per_kg = Number(data.cost_per_kg);
    if (data.rider_commission_percentage !== undefined)
      updateData.rider_commission_percentage = Number(
        data.rider_commission_percentage,
      );

    await settingsCollection.updateOne(
      {},
      { $set: updateData },
      { upsert: true },
    );

    const log: AuditLog = {
      admin_email: adminEmail,
      action: "UPDATE_SETTINGS",
      details: `Updated system settings: ${JSON.stringify(updateData)}`,
      timestamp: new Date().toISOString(),
    };
    await auditCollection.insertOne(log);
  }

  static async getFleetDistribution(): Promise<any[]> {
    return ridersCollection
      .aggregate([{ $group: { _id: "$vehicleType", count: { $sum: 1 } } }])
      .toArray();
  }
}
