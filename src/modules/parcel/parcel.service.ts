import { ObjectId, UpdateResult, InsertOneResult, DeleteResult } from "mongodb";
import { config } from "../../config";
import {
  parcelCollection,
  trackingCollection,
  settingsCollection,
  auditCollection,
  addTrackingUpdate,
  ridersCollection,
  usersCollection,
} from "../../db/db";
import { createNotification } from "../notification/notification.controller";
import { Parcel, TrackingUpdate } from "./parcel.interface";
import { SystemSettings } from "../admin/admin.interface";

export class ParcelService {
  static async getMyParcels(
    email: string,
    payment_status?: string,
    delivery_status?: string,
  ): Promise<Parcel[]> {
    const query: any = { created_by: email };
    if (payment_status) query.payment_status = payment_status;
    if (delivery_status) query.delivery_status = delivery_status;

    return (await parcelCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()) as unknown as Parcel[];
  }

  static async getMyParcelStats(email: string) {
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

    return (
      stats[0] || {
        totalSpent: 0,
        totalParcels: 0,
        delivered: 0,
        pending: 0,
        on_the_way: 0,
      }
    );
  }

  static async calculateCost(weight: number, requiredVehicle: string = "bike") {
    const settings = (await settingsCollection.findOne(
      {},
    )) as unknown as SystemSettings;
    const baseFee = settings?.base_delivery_fee || 50;
    const costPerKg = settings?.cost_per_kg || 20;
    const riderCommissionPct = settings?.rider_commission_percentage || 15;

    const vehicleMultipliers = {
      bike: 1,
      car: 1.5,
      mini_pickup: 2.2,
      large_pickup: 3.5,
    };
    const multiplier =
      vehicleMultipliers[requiredVehicle as keyof typeof vehicleMultipliers] ||
      1;

    const baseCost = baseFee + (weight > 1 ? (weight - 1) * costPerKg : 0);
    const totalCost = baseCost * multiplier;

    const riderEarning = (totalCost * riderCommissionPct) / 100;
    const adminProfit = totalCost - riderEarning;

    return { totalCost, riderEarning, adminProfit };
  }

  static async bookParcel(
    parcel: Omit<Parcel, "_id">,
  ): Promise<InsertOneResult> {
    const result = await parcelCollection.insertOne(parcel);
    await addTrackingUpdate(
      parcel.trackingId,
      "booked",
      "Your parcel has been booked and is awaiting collection.",
    );
    return result;
  }

  static async getParcelById(id: string): Promise<Parcel | null> {
    return (await parcelCollection.findOne({
      _id: new ObjectId(String(id)),
    })) as unknown as Parcel | null;
  }

  static async updateParcel(
    id: string,
    updateData: Partial<Parcel>,
  ): Promise<UpdateResult> {
    return parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateData },
    );
  }

  static async deleteParcel(id: string): Promise<DeleteResult> {
    return parcelCollection.deleteOne({ _id: new ObjectId(String(id)) });
  }

  static async markPicked(id: string): Promise<UpdateResult> {
    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          delivery_status: "on_the_way",
          picked_at: new Date().toISOString(),
        },
      },
    );

    const parcel = await this.getParcelById(id);
    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "on_the_way",
        "Parcel has been picked up and is on the way.",
        "Pickup Point",
      );
    }

    return result;
  }

  static async markDelivered(id: string): Promise<UpdateResult> {
    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          delivery_status: "delivered",
          delivered_at: new Date().toISOString(),
        },
      },
    );

    const parcel = await this.getParcelById(id);
    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "delivered",
        "Parcel has been successfully delivered to the recipient.",
        parcel.receiverDistrict,
      );
    }

    return result;
  }

  static async bulkIngestParcels(
    newParcels: Parcel[],
    email: string,
  ): Promise<void> {
    await parcelCollection.insertMany(newParcels);
    await auditCollection.insertOne({
      admin_email: email,
      action: "BULK_PARCEL_INGEST",
      details: `Merchant ${email} uploaded ${newParcels.length} parcels.`,
      timestamp: new Date().toISOString(),
    });
  }

  static async getAllParcels(
    filter: { delivery_status?: string; startDate?: string; endDate?: string },
    page: number,
    size: number,
  ) {
    const skip = (page - 1) * size;
    const query: any = {};

    if (filter.delivery_status && filter.delivery_status !== "all") {
      query.delivery_status = filter.delivery_status;
    }

    if (filter.startDate || filter.endDate) {
      query.creation_date = {};
      if (filter.startDate)
        query.creation_date.$gte = new Date(filter.startDate).toISOString();
      if (filter.endDate)
        query.creation_date.$lte = new Date(filter.endDate).toISOString();
    }

    const totalItems = await parcelCollection.countDocuments(query);
    const parcels = await parcelCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    return { parcels, totalItems };
  }
}

