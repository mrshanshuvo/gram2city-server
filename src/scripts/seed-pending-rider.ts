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

    const testRiders = [
      {
        email: "rider1@gmail.com",
        name: "Shahid Hasan Shovu",
        phone: "01712345678",
        nid: "1234567890",
        age: 25,
        bikeBrand: "Yamaha FZ-S",
        bikeRegNo: "Dhaka Metro-LA-12-3456",
        district: "Dhaka",
        region: "Dhaka South",
        additionalInfo: "Express logistics hero ready to deliver!",
      },
      {
        email: "rider2@gmail.com",
        name: "Rafiqul Islam",
        phone: "01823456789",
        nid: "9876543210",
        age: 28,
        bikeBrand: "Suzuki Gixxer",
        bikeRegNo: "Dhaka Metro-HA-56-7890",
        district: "Dhaka",
        region: "Dhaka North",
        additionalInfo:
          "Experienced rider with excellent local route knowledge.",
      },
      {
        email: "rider3@gmail.com",
        name: "Anika Rahman",
        phone: "01934567890",
        nid: "5432109876",
        age: 23,
        bikeBrand: "Honda Dio",
        bikeRegNo: "Dhaka Metro-KA-90-1234",
        district: "Chattogram",
        region: "Chattogram Central",
        additionalInfo:
          "Fast and reliable, looking for flexible part-time deliveries.",
      },
      {
        email: "rider4@gmail.com",
        name: "Tanvir Ahmed",
        phone: "01545678901",
        nid: "3210987654",
        age: 30,
        bikeBrand: "TVS Apache RTR",
        bikeRegNo: "Sylhet Metro-LA-34-5678",
        district: "Sylhet",
        region: "Sylhet Sadar",
        additionalInfo:
          "Familiar with city hotspots, ready for immediate boarding.",
      },
    ];

    for (const testRider of testRiders) {
      // 1. Find or create user
      let user = await usersCol.findOne({ email: testRider.email });
      if (!user) {
        console.log(`👤 Creating test user ${testRider.email}...`);
        const result = await usersCol.insertOne({
          email: testRider.email,
          name: testRider.name,
          role: "user",
          status: "active",
          created_at: new Date().toISOString(),
        });
        user = await usersCol.findOne({ _id: result.insertedId });
      } else {
        console.log(
          `👤 Test user ${testRider.email} already exists. Updating role to 'user' for pending testing...`,
        );
        await usersCol.updateOne(
          { _id: user._id },
          { $set: { role: "user", name: testRider.name } },
        );
      }

      if (!user) {
        throw new Error(`Failed to resolve test user: ${testRider.email}`);
      }

      // 2. Remove pre-existing rider profile to prevent duplicates
      await ridersCol.deleteOne({ userId: user._id });

      // 3. Create a pending rider application
      console.log(
        `🏍️ Seeding pending rider application for ${testRider.email}...`,
      );
      await ridersCol.insertOne({
        userId: user._id,
        name: testRider.name,
        email: testRider.email,
        phone: testRider.phone,
        status: "pending",
        nid: testRider.nid,
        age: testRider.age,
        bikeBrand: testRider.bikeBrand,
        bikeRegNo: testRider.bikeRegNo,
        district: testRider.district,
        region: testRider.region,
        additionalInfo: testRider.additionalInfo,
        createdAt: new Date().toISOString(),
      });
    }

    console.log(
      "🎉 Seeding complete! Multiple pending applications generated.",
    );
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await client.close();
    console.log("🔌 Database connection closed.");
  }
}

runSeed();
