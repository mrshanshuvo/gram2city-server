import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { config } from "../config";
import { initDB } from "../db/db";

declare const process: any;

async function runMigration() {
  const uri = process.env.MONGODB_URI || config?.MONGODB_URI || "";
  const dbName = process.env.DB_NAME || config?.DB_NAME || "gram2city";

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in the environment.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("🔌 Connected to database...");
    const db = client.db(dbName);

    // Initialize/Update database indexes first (drops email_1 unique constraint)
    console.log("🛠️ Re-indexing database collections...");
    await initDB();

    const usersCol = db.collection("users");
    const ridersCol = db.collection("riders");
    const merchantsCol = db.collection("merchants");

    // ─── 1. Migrate Riders ───────────────────────────────────────────────────
    console.log("🏍️ Starting Rider profiles migration...");
    const riders = await ridersCol.find().toArray();
    let migratedRiders = 0;

    for (const rider of riders) {
      if (rider.email) {
        const user = await usersCol.findOne({ email: rider.email });
        if (user) {
          await ridersCol.updateOne(
            { _id: rider._id },
            {
              $set: { userId: user._id },
              $unset: { name: "", email: "", photoURL: "" },
            }
          );
          migratedRiders++;
        } else {
          console.warn(`⚠️ User not found for rider email: ${rider.email}`);
        }
      }
    }
    console.log(`✅ Migrated ${migratedRiders}/${riders.length} Rider profiles.`);

    // ─── 2. Migrate Merchants ────────────────────────────────────────────────
    console.log("🏪 Starting Merchant profiles migration...");
    const merchants = await merchantsCol.find().toArray();
    let migratedMerchants = 0;

    for (const merchant of merchants) {
      if (merchant.email && !merchant.userId) {
        const user = await usersCol.findOne({ email: merchant.email });
        if (user) {
          await merchantsCol.updateOne(
            { _id: merchant._id },
            {
              $set: { userId: user._id },
              $unset: { email: "" },
            }
          );
          migratedMerchants++;
        } else {
          console.warn(`⚠️ User not found for merchant email: ${merchant.email}`);
        }
      } else if (merchant.userId && merchant.email) {
        // Just strip the email to prevent duplicates (Option A)
        await merchantsCol.updateOne(
          { _id: merchant._id },
          { $unset: { email: "" } }
        );
        migratedMerchants++;
      }
    }
    console.log(`✅ Migrated ${migratedMerchants}/${merchants.length} Merchant profiles.`);

    console.log("🎉 Database profile migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.close();
    console.log("🔌 Database connection closed.");
  }
}

runMigration();
