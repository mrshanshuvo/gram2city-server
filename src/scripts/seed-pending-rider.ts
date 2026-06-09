import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { config } from "../config";

declare const process: any;

async function runSeed() {
  const uri = process.env.MONGODB_URI || config?.MONGODB_URI || "";
  const dbName = process.env.DB_NAME || config?.DB_NAME || "gram2city";

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("🔌 Connected to database...");
    const db = client.db(dbName);

    const usersCol = db.collection("users");
    const ridersCol = db.collection("riders");

    // 1. Find or create the test user rider1@gmail.com
    let user = await usersCol.findOne({ email: "rider1@gmail.com" });
    if (!user) {
      console.log("👤 Creating test user rider1@gmail.com...");
      const result = await usersCol.insertOne({
        email: "rider1@gmail.com",
        name: "Rider One",
        role: "user",
        status: "active",
        created_at: new Date().toISOString(),
      });
      user = await usersCol.findOne({ _id: result.insertedId });
    } else {
      console.log(
        "👤 Test user rider1@gmail.com already exists. Updating role to 'user' for pending testing...",
      );
      await usersCol.updateOne({ _id: user._id }, { $set: { role: "user" } });
    }

    if (!user) {
      throw new Error("Failed to resolve test user.");
    }

    // 2. Remove any pre-existing rider profile for this user to avoid duplication conflicts
    await ridersCol.deleteOne({ userId: user._id });

    // 3. Create a pending rider application
    console.log("🏍️ Seeding pending rider application...");
    await ridersCol.insertOne({
      userId: user._id,
      phone: "01712345678",
      status: "pending",
      nid: "1234567890",
      age: 25,
      bikeBrand: "Yamaha FZ-S",
      bikeRegNo: "Dhaka Metro-LA-12-3456",
      district: "Dhaka",
      region: "Dhaka South",
      additionalInfo: "Express logistics hero ready to deliver!",
      createdAt: new Date().toISOString(),
    });

    console.log(
      "🎉 Seeding complete! rider1@gmail.com has a pending application.",
    );
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await client.close();
    console.log("🔌 Database connection closed.");
  }
}

runSeed();
