import { InsertOneResult } from "mongodb";
import { trackingCollection } from "../../../db/db";
import { TrackingUpdate } from "../parcel.interface";

export class TrackingService {
  static async getTrackingHistory(trackingId: string): Promise<TrackingUpdate[]> {
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

  static async getPublicTracking(trackingId: string) {
    return trackingCollection.find({ trackingId }).sort({ time: -1 }).toArray();
  }
}
