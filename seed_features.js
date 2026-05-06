const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function seedFeatures() {
  try {
    await client.connect();
    const db = client.db("parcelDB");
    const featuresCollection = db.collection("features");

    const features = [
      {
        title: "Focused Rural-Urban Network",
        description:
          "We specialize in the bridge between village production and city demand, connecting the heart of rural Bangladesh to urban markets.",
        image: "/images/features/network.png",
        icon: "Globe",
        isActive: true,
        order: 1,
      },
      {
        title: "Built for Local Merchants",
        description:
          "A logistics partner that grows with you. We provide tailored support and digital tools designed specifically for small business owners.",
        image: "/images/features/merchant.png",
        icon: "Box",
        isActive: true,
        order: 2,
      },
      {
        title: "Real-Time Digital Trust",
        description:
          "Transparency is our foundation. Modern tracking technology that keeps you and your customers informed every step of the way.",
        image: "/images/features/tracking.png",
        icon: "Clock",
        isActive: true,
        order: 3,
      },
    ];

    await featuresCollection.deleteMany({});
    const result = await featuresCollection.insertMany(features);
    console.log(`✅ Seeded ${result.insertedCount} features successfully!`);
  } catch (error) {
    console.error("❌ Error seeding features:", error);
  } finally {
    await client.close();
  }
}

seedFeatures();
