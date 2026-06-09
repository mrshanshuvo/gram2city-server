import { ObjectId, InsertOneResult } from "mongodb";
import {
  ridersCollection,
  parcelCollection,
  cashoutsCollection,
  notificationsCollection,
  reviewsCollection,
  usersCollection,
  auditCollection,
  addTrackingUpdate,
} from "../../db/db";
import { Rider, Cashout } from "./rider.interface";
import { Parcel } from "../parcel/parcel.interface";

export class RiderService {
  static async submitApplication(
    application: Omit<Rider, "_id">,
  ): Promise<InsertOneResult> {
    return ridersCollection.insertOne(application);
  }

  static async getAllRiders(
    status?: string,
    pageNum: number = 1,
    sizeNum: number = 50,
  ) {
    const query: any = {};
    if (status === "available") {
      query.status = "approved";
    } else if (status) {
      query.status = status;
    }

    const totalItems = await ridersCollection.countDocuments(query);

    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          name: { $ifNull: ["$userDetails.name", "$name"] },
          email: { $ifNull: ["$userDetails.email", "$email"] },
          photoURL: { $ifNull: ["$userDetails.photoURL", "$photoURL"] },
        },
      },
      { $project: { userDetails: 0 } },
      { $skip: (pageNum - 1) * sizeNum },
      { $limit: sizeNum },
    ];

    const riders = (await ridersCollection
      .aggregate(pipeline)
      .toArray()) as unknown as Rider[];

    return { riders, totalItems };
  }

  static async getRiderByEmail(email: string): Promise<Rider | null> {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return (await ridersCollection.findOne({
        email,
      })) as unknown as Rider | null;
    }
    const rider = (await ridersCollection.findOne({
      $or: [{ userId: user._id }, { email }],
    })) as any;

    if (rider) {
      rider.name = user.name || rider.name;
      rider.email = user.email || rider.email;
      rider.photoURL = user.photoURL || rider.photoURL;
    }
    return rider as Rider | null;
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

  static async updateParcelDeliveryStatus(
    id: string,
    riderId: ObjectId,
    delivery_status: string,
  ) {
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
        { $inc: { total_delivered: 1 } },
      );
    }

    await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateFields },
    );

    const statusMsg =
      delivery_status === "delivered"
        ? "delivered successfully"
        : "now on the way";
    await addTrackingUpdate(
      parcel.trackingId,
      delivery_status,
      `Parcel has been ${statusMsg}.`,
    );

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
      totalDelivered:
        rider?.total_delivered || deliveryStats[0]?.totalDelivered || 0,
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

    const available =
      (deliveryStats[0]?.total || 0) - (cashedOut[0]?.total || 0);

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

  static async updateRiderStatus(
    id: string,
    status: string,
    adminEmail: string,
  ): Promise<{ success: boolean; message: string; modifiedCount: number }> {
    const rider = await ridersCollection.findOne({
      _id: new ObjectId(String(id)),
    });
    if (!rider) {
      return {
        success: false,
        message: "Rider application not found",
        modifiedCount: 0,
      };
    }

    const updateResult = await ridersCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: status as any } },
    );

    if (status === "approved") {
      const emailToLookup =
        rider.email ||
        (await usersCollection.findOne({ _id: rider.userId }))?.email;
      if (emailToLookup) {
        await usersCollection.updateOne(
          { email: emailToLookup },
          { $set: { role: "rider" } },
        );
      }
    }

    await auditCollection.insertOne({
      admin_email: adminEmail,
      action: "RIDER_STATUS_CHANGE",
      target_id: id,
      details: `Changed rider application status to ${status}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Rider status updated to ${status}`,
      modifiedCount: updateResult.modifiedCount,
    };
  }
}
