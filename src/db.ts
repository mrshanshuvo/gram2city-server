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
  ChatMessage,
  Feedback,
  FAQ,
  FAQVote,
  BannerSlide,
  ServiceItem,
  FeatureItem,
  PartnerLogo,
  ProcessStep,
  LandingConfig,
  Avatar,
  Merchant,
  Address,
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
export const auditCollection = db.collection<any>("audit_logs");
export const settingsCollection = db.collection<any>("system_settings");
export const messagesCollection = db.collection<ChatMessage>("messages");
export const feedbackCollection = db.collection<Feedback>("feedback");
export const faqsCollection = db.collection<FAQ>("faqs");
export const faqVotesCollection = db.collection<FAQVote>("faq_votes");
export const bannersCollection = db.collection<BannerSlide>("banners");
export const servicesCollection = db.collection<ServiceItem>("services");
export const featuresCollection = db.collection<FeatureItem>("features");
export const partnersCollection = db.collection<PartnerLogo>("partners");
export const processStepsCollection = db.collection<ProcessStep>("process_steps");
export const landingConfigCollection = db.collection<LandingConfig>("landing_config");
export const avatarsCollection = db.collection<Avatar>("avatars");
export const merchantsCollection = db.collection<Merchant>("merchants");
export const warehousesCollection = db.collection("warehouses");
export const newsletterCollection = db.collection("newsletter");
export const testimonialsCollection = db.collection<any>("testimonials");
export const addressesCollection = db.collection<Address>("addresses");

// ─── DB Initialization (Indexing) ─────────────────────────────────────────────
export const initDB = async () => {
  try {
    // Unique tracking IDs
    await parcelCollection.createIndex({ trackingId: 1 }, { unique: true });
    
    // Fast user lookups
    await usersCollection.createIndex({ email: 1 });
    
    // Merchant & Rider lookups
    await merchantsCollection.createIndex({ email: 1 });
    await ridersCollection.createIndex({ email: 1 });
    
    // High-density parcel queries
    await parcelCollection.createIndex({ created_by: 1 });
    await parcelCollection.createIndex({ delivery_status: 1 });
    await parcelCollection.createIndex({ assigned_rider_email: 1 });
    
    // Performance: Recent activity feeds
    await auditCollection.createIndex({ timestamp: -1 });
    await trackingCollection.createIndex({ trackingId: 1, time: -1 });
    
    console.log("✅ Database indexes verified.");
  } catch (error) {
    console.error("❌ Database indexing failed:", error);
  }
};

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
