const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);

async function seed() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const servicesCollection = db.collection("services");

    const services = [
      {
        title: "Same Day Delivery",
        description:
          "Experience the ultimate speed. Our premium express service ensures your parcel is delivered within 24 hours in major city areas.",
        image: "/images/services/pick_and_drop.png",
        icon: "Zap",
        color: "from-[#F4C20D] to-[#E5B100]",
        isActive: true,
        order: 1,
      },
      {
        title: "Nationwide Logistics",
        description:
          "Connecting the furthest villages to the busiest cities. Our expansive network covers every district with localized expertise.",
        image: "/images/services/truck.png",
        icon: "Globe",
        color: "from-[#2E7D32] to-[#1B5E20]",
        isActive: true,
        order: 2,
      },
      {
        title: "Secure Corporate Shipping",
        description:
          "Tailored solutions for your business. We handle bulk shipments and sensitive cargo with high-level security and priority routing.",
        image: "/images/services/corporate.png",
        icon: "ShieldCheck",
        color: "from-[#1E5AA8] to-[#154380]",
        isActive: true,
        order: 3,
      },
      {
        title: "Ecommerce Delivery",
        description: "Reliable shipping solutions for your online business. We handle your customers' parcels with care and ensure timely doorstep delivery.",
        image: "/images/services/ecommerce.png",
        icon: "ShoppingBag",
        color: "from-[#2E7D32] to-[#1E5AA8]",
        isActive: true,
        order: 4
      }
    ];

    await servicesCollection.deleteMany({});
    await servicesCollection.insertMany(services);

    console.log("✅ Seeded service illustrations successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
