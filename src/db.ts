import { MongoClient, ServerApiVersion } from "mongodb";
import type {
  User,
  Parcel,
  Rider,
  Payment,
  Cashout,
  TrackingUpdate,
  Review,
  Notification,
} from "./types";

// ─── MongoDB Client ───────────────────────────────────────────────────────────

const client = new MongoClient(process.env.MONGODB_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ─── Typed Collections ────────────────────────────────────────────────────────

const db = client.db(process.env.DB_NAME as string);

export const usersCollection = db.collection<User>("users");
export const parcelCollection = db.collection<Parcel>("parcels");
export const paymentCollection = db.collection<Payment>("payments");
export const ridersCollection = db.collection<Rider>("riders");
export const cashoutsCollection = db.collection<Cashout>("cashouts");
export const trackingCollection = db.collection<TrackingUpdate>("trackings");
export const reviewsCollection = db.collection<Review>("reviews");
export const notificationsCollection =
  db.collection<Notification>("notifications");

// ─── Shared Helper ────────────────────────────────────────────────────────────

export const addTrackingUpdate = async (
  trackingId: string,
  status: string,
  details: string,
  location = "Primary Hub",
): Promise<void> => {
  try {
    await trackingCollection.insertOne({
      trackingId,
      status,
      details,
      location,
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to add tracking update:", error);
  }
};
