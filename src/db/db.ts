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
} from "../types/types";

import { config } from "../config";

// ─── MongoDB Client ───────────────────────────────────────────────────────────

const client = new MongoClient(config.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ─── Typed Collections ────────────────────────────────────────────────────────

const db = client.db(config.DB_NAME);

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
export const processStepsCollection =
  db.collection<ProcessStep>("process_steps");
export const landingConfigCollection =
  db.collection<LandingConfig>("landing_config");
export const avatarsCollection = db.collection<Avatar>("avatars");
export const merchantsCollection = db.collection<Merchant>("merchants");
export const warehousesCollection = db.collection("warehouses");
export const newsletterCollection = db.collection("newsletter");
export const testimonialsCollection = db.collection<any>("testimonials");
export const addressesCollection = db.collection<Address>("addresses");

// ─── DB Initialization (Indexing) ─────────────────────────────────────────────
export const initDB = async () => {
  try {
    const dropIndexIfExists = async (collection: any, indexName: string) => {
      try {
        await collection.dropIndex(indexName);
      } catch (err) {
        // Ignore if index doesn't exist or cannot be dropped
      }
    };

    const deduplicateCollection = async (collection: any, key: string) => {
      try {
        const duplicates = await collection
          .aggregate([
            {
              $group: {
                _id: `$${key}`,
                ids: { $push: "$_id" },
                count: { $sum: 1 },
              },
            },
            {
              $match: {
                count: { $gt: 1 },
              },
            },
          ])
          .toArray();

        for (const dup of duplicates) {
          if (dup._id) {
            const idsToDelete = dup.ids.slice(1);
            await collection.deleteMany({ _id: { $in: idsToDelete } });
          }
        }
      } catch (err) {
        console.error(`Failed to deduplicate collection:`, err);
      }
    };

    // Safely drop old non-unique indexes before replacing them with unique indexes
    await dropIndexIfExists(usersCollection, "email_1");
    await dropIndexIfExists(merchantsCollection, "email_1");
    await dropIndexIfExists(ridersCollection, "email_1");

    // Deduplicate collections to prevent DuplicateKey index build errors
    await deduplicateCollection(usersCollection, "email");
    await deduplicateCollection(merchantsCollection, "email");
    await deduplicateCollection(ridersCollection, "email");

    // 1. usersCollection
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    // 2. merchantsCollection
    await dropIndexIfExists(merchantsCollection, "email_1");
    await dropIndexIfExists(merchantsCollection, "userId_1");
    await merchantsCollection.createIndex({ userId: 1 }, { unique: true });

    // 3. ridersCollection
    await dropIndexIfExists(ridersCollection, "email_1");
    await ridersCollection.createIndex({ userId: 1 }, { unique: true });

    // 4. parcelCollection
    await parcelCollection.createIndex({ trackingId: 1 }, { unique: true });
    await parcelCollection.createIndex({
      assigned_rider_email: 1,
      delivery_status: 1,
    });
    await parcelCollection.createIndex({
      assigned_rider_id: 1,
      delivery_status: 1,
    });
    await parcelCollection.createIndex({ created_by: 1, payment_status: 1 });
    await parcelCollection.createIndex({
      delivery_status: 1,
      creation_date: -1,
    });

    // 5. trackingCollection
    await trackingCollection.createIndex({ trackingId: 1, time: -1 });

    // 6. auditCollection
    await auditCollection.createIndex({ timestamp: -1 });

    // 7. messagesCollection
    await messagesCollection.createIndex({ conversationId: 1, timestamp: 1 });
    await messagesCollection.createIndex({ senderEmail: 1, timestamp: -1 });
    await messagesCollection.createIndex({ receiverEmail: 1, timestamp: -1 });

    // 8. notificationsCollection
    await notificationsCollection.createIndex({
      email: 1,
      isRead: 1,
      time: -1,
    });

    // 9. reviewsCollection
    await reviewsCollection.createIndex({ rider_email: 1, date: -1 });

    // 10. addressesCollection
    await addressesCollection.createIndex({ userEmail: 1, isDefault: 1 });

    // 11. cashoutsCollection
    await cashoutsCollection.createIndex({ rider_email: 1, requested_at: -1 });

    // 12. faqsCollection
    await faqsCollection.createIndex({ category: 1, order: 1 });

    // 13. faqVotesCollection
    await faqVotesCollection.createIndex(
      { faqId: 1, identifier: 1 },
      { unique: true },
    );

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
