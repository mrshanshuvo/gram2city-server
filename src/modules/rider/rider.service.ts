import { ObjectId, InsertOneResult } from "mongodb";
import {
  ridersCollection,
  parcelCollection,
  cashoutsCollection,
  notificationsCollection,
  reviewsCollection,
  addTrackingUpdate,
} from "../../db";
import { Rider, Cashout } from "./rider.interface";
import { Parcel } from "../parcel/parcel.interface";

export class RiderService {
  static async submitApplication(application: Omit<Rider, "_id">): Promise<InsertOneResult> {
    return ridersCollection.insertOne(application);
  }

  static async getAllRiders(status?: string, pageNum: number = 1, sizeNum: number = 50) {
    const query: any = {};
    if (status === "available") {
      query.status = "approved";
    } else if (status) {
      query.status = status;
    }

    const totalItems = await ridersCollection.countDocuments(query);
    const riders = (await ridersCollection
      .find(query)
      .skip((pageNum - 1) * sizeNum)
      .limit(sizeNum)
      .toArray()) as unknown as Rider[];

    return { riders, totalItems };
  }

  static async getRiderByEmail(email: string): Promise<Rider | null> {
    return (await ridersCollection.findOne({ email })) as unknown as Rider | null;
  }

  static async getAssignedParcels(riderId: ObjectId): Promise<Parcel[]> {
    return (await parcelCollection
      .find({
        assigned_rider_id: riderId,
        delivery_status: { $in: ["assigned", "on_the_way", "delivered"] },
      })
      .sort({ creation_date: -1 })
      .toArray()) as unknown as Parcel[];
  }

  static async updateParcelDeliveryStatus(id: string, riderId: ObjectId, delivery_status: string) {
    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
      assigned_rider_id: riderId,
    });

    if (!parcel) {
      return { success: false, message: "Parcel not assigned to you." };
    }

    const updateFields: any = { delivery_status };

    if (delivery_status === "delivered") {
      updateFields.delivered_at = new Date().toISOString();

      // Update Rider Performance Metrics
      await ridersCollection.updateOne(
        { _id: riderId },
        { $inc: { total_delivered: 1 } }
      );
    }

    await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateFields }
    );

    const statusMsg = delivery_status === "delivered" ? "delivered successfully" : "now on the way";
    await addTrackingUpdate(parcel.trackingId, delivery_status, `Parcel has been ${statusMsg}.`);

    await notificationsCollection.insertOne({
      email: parcel.created_by,
      message: `Status Update: Your parcel "${parcel.parcelName}" is ${statusMsg}!`,
      time: new Date().toISOString(),
      isRead: false,
      type: "status_update",
    });

    return { success: true, message: `Status updated to ${delivery_status}.` };
  }

  static async getRiderReviews(email: string): Promise<any[]> {
    return reviewsCollection
      .find({ rider_email: email })
      .sort({ date: -1 })
      .toArray();
  }

  static async getRiderStats(email: string) {
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

    const rider = await this.getRiderByEmail(email);

    return {
      totalEarnings: deliveryStats[0]?.totalEarnings || 0,
      totalDelivered: rider?.total_delivered || deliveryStats[0]?.totalDelivered || 0,
      averageRating: rider?.average_rating || 0,
    };
  }

  static async requestPayout(email: string, amount: number) {
    const rider = await this.getRiderByEmail(email);
    if (!rider) {
      return { success: false, message: "Rider not found" };
    }

    // Calculate actual earnings minus already cashed out
    const deliveryStats = await parcelCollection
      .aggregate([
        {
          $match: { assigned_rider_email: email, delivery_status: "delivered" },
        },
        { $group: { _id: null, total: { $sum: "$rider_earning" } } },
      ])
      .toArray();

    const cashedOut = await cashoutsCollection
      .aggregate([
        { $match: { rider_email: email, status: { $ne: "rejected" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    const available = (deliveryStats[0]?.total || 0) - (cashedOut[0]?.total || 0);

    if (amount > available) {
      return { success: false, message: "Insufficient balance." };
    }

    const payoutRequest: Omit<Cashout, "_id"> = {
      rider_email: email,
      rider_name: rider.name,
      amount: Number(amount),
      status: "pending",
      requested_at: new Date().toISOString(),
    };

    await cashoutsCollection.insertOne(payoutRequest as any);

    return { success: true, message: "Payout request submitted successfully." };
  }
}
