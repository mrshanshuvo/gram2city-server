import { ObjectId, UpdateResult, InsertOneResult, DeleteResult } from "mongodb";
import axios from "axios";
import FormData from "form-data";
import { config } from "../../config";
import {
  parcelCollection,
  trackingCollection,
  settingsCollection,
  auditCollection,
  addTrackingUpdate,
} from "../../db";
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

  static async getTrackingHistory(
    trackingId: string,
  ): Promise<TrackingUpdate[]> {
    return (await trackingCollection
      .find({ trackingId })
      .sort({ time: -1 })
      .toArray()) as unknown as TrackingUpdate[];
  }

  static async getRecentTrackings(): Promise<TrackingUpdate[]> {
    return (await trackingCollection
      .find({})
      .sort({ time: -1 })
      .limit(10)
      .toArray()) as unknown as TrackingUpdate[];
  }

  static async addManualTrackingUpdate(
    trackingId: string,
    status: string,
    details: string,
    location: string = "Processing Center",
  ): Promise<InsertOneResult> {
    const update = {
      trackingId,
      status,
      details,
      location,
      time: new Date().toISOString(),
    };
    return trackingCollection.insertOne(update);
  }

  static async uploadImage(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("image", fileBuffer, {
      filename,
      contentType: mimetype,
    });

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${config.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    return response.data.data.url;
  }
}
