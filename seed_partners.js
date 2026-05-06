const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);

async function seed() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const partnersCollection = db.collection("partners");

    const partners = [
      { name: "Sundora", logo: "/images/top-enterprises-carousel/sundora_v2.png", isActive: true, order: 1, createdAt: new Date().toISOString() },
      { name: "Apple Gadgets", logo: "/images/top-enterprises-carousel/appleGadgets_v2.png", isActive: true, order: 2, createdAt: new Date().toISOString() },
      { name: "Arogga", logo: "/images/top-enterprises-carousel/arogga_v2.png", isActive: true, order: 3, createdAt: new Date().toISOString() },
      { name: "Arong", logo: "/images/top-enterprises-carousel/arong_v2.png", isActive: true, order: 4, createdAt: new Date().toISOString() },
      { name: "Bata", logo: "/images/top-enterprises-carousel/bata_v2.jpg", isActive: true, order: 5, createdAt: new Date().toISOString() },
      { name: "Daraz", logo: "/images/top-enterprises-carousel/daraz_v2.png", isActive: true, order: 6, createdAt: new Date().toISOString() },
      { name: "Falaq Food", logo: "/images/top-enterprises-carousel/falaqFood_v2.jpg", isActive: true, order: 7, createdAt: new Date().toISOString() },
      { name: "Head Gear", logo: "/images/top-enterprises-carousel/headGear_v2.png", isActive: true, order: 8, createdAt: new Date().toISOString() },
      { name: "Herlan", logo: "/images/top-enterprises-carousel/herlan_v2.jpg", isActive: true, order: 9, createdAt: new Date().toISOString() },
      { name: "Pickaboo", logo: "/images/top-enterprises-carousel/pickaboo_v2.png", isActive: true, order: 10, createdAt: new Date().toISOString() },
      { name: "Raw Nation", logo: "/images/top-enterprises-carousel/rawNation_v2.jpg", isActive: true, order: 11, createdAt: new Date().toISOString() },
      { name: "Ribana", logo: "/images/top-enterprises-carousel/ribana_v2.png", isActive: true, order: 12, createdAt: new Date().toISOString() },
      { name: "Rokomari", logo: "/images/top-enterprises-carousel/rokomari_v2.png", isActive: true, order: 13, createdAt: new Date().toISOString() },
      { name: "Sailor", logo: "/images/top-enterprises-carousel/sailor_v2.png", isActive: true, order: 14, createdAt: new Date().toISOString() },
      { name: "Shajgoj", logo: "/images/top-enterprises-carousel/shajgoj_v2.png", isActive: true, order: 15, createdAt: new Date().toISOString() },
      { name: "Wafilife", logo: "/images/top-enterprises-carousel/wafilife_v2.jpg", isActive: true, order: 16, createdAt: new Date().toISOString() },
    ];

    await partnersCollection.deleteMany({});
    await partnersCollection.insertMany(partners);

    console.log("✅ Seeded partner logos successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
