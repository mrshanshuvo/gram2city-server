import "dotenv/config";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI as string);

async function seed() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    
    // 1. Banners
    const banners = [
      {
        title: "Express Delivery from Village to City",
        subtitle: "Fast, reliable, and secure. We bridge the gap with our high-speed logistics network, ensuring your parcels reach any destination in record time.",
        image: "https://i.ibb.co/3Yh3Q3v/banner1.png", // Placeholder or existing image
        ctaText: "Start Shipping",
        ctaLink: "/addParcel",
        icon: "Zap",
        color: "from-[#2E7D32]/60 to-[#1E5AA8]/60",
        isActive: true,
        order: 1
      },
      {
        title: "Empowering Businesses & Merchants",
        subtitle: "Scale your reach with Gram2City. Our professional logistics solutions provide the backbone for your business growth across the nation.",
        image: "https://i.ibb.co/6yX1X1X/banner2.png",
        ctaText: "Join as Merchant",
        ctaLink: "/register",
        icon: "ShieldCheck",
        color: "from-[#1E5AA8]/60 to-[#2E7D32]/60",
        isActive: true,
        order: 2
      },
      {
        title: "Real-Time Tracking & Transparency",
        subtitle: "Stay informed every step of the way. Our advanced tracking technology gives you complete visibility from pickup to the final doorstep.",
        image: "https://i.ibb.co/9yZ1Z1Z/banner3.png",
        ctaText: "Track Now",
        ctaLink: "/dashboard/trackParcel",
        icon: "Package",
        color: "from-slate-900/60 to-slate-800/40",
        isActive: true,
        order: 3
      }
    ];

    // 2. Services
    const services = [
      {
        title: "Same Day Delivery",
        description: "Experience the ultimate speed. Our premium express service ensures your parcel is delivered within 24 hours in major city areas.",
        icon: "Zap",
        color: "from-[#F4C20D] to-[#E5B100]",
        isActive: true,
        order: 1
      },
      {
        title: "Nationwide Logistics",
        description: "Connecting the furthest villages to the busiest cities. Our expansive network covers every district with localized expertise.",
        icon: "Globe",
        color: "from-[#2E7D32] to-[#1B5E20]",
        isActive: true,
        order: 2
      },
      {
        title: "Secure Corporate Shipping",
        description: "Tailored solutions for your business. We handle bulk shipments and sensitive cargo with high-level security and priority routing.",
        icon: "ShieldCheck",
        color: "from-[#1E5AA8] to-[#154380]",
        isActive: true,
        order: 3
      }
    ];

    // 3. Features
    const features = [
      {
        title: "Real-Time Live Tracking",
        description: "Stay connected with your cargo. Our advanced GPS integration allows you to monitor every turn and stop in real-time.",
        image: "https://i.ibb.co/vX1X1X1/live-tracking.png",
        icon: "Truck",
        isActive: true,
        order: 1
      },
      {
        title: "Elite Safety & Handling",
        description: "Your trust is our priority. We employ multi-layered security protocols and specialized handling equipment.",
        image: "https://i.ibb.co/mX1X1X1/safe-delivery.png",
        icon: "ShieldCheck",
        isActive: true,
        order: 2
      },
      {
        title: "24/7 Dedicated Support",
        description: "Logistics never sleeps, and neither do we. Our expert support team is always on standby to resolve queries.",
        image: "https://i.ibb.co/sX1X1X1/call-center.jpg",
        icon: "Headset",
        isActive: true,
        order: 3
      }
    ];

    await db.collection("banners").deleteMany({});
    await db.collection("banners").insertMany(banners);
    
    await db.collection("services").deleteMany({});
    await db.collection("services").insertMany(services);
    
    await db.collection("features").deleteMany({});
    await db.collection("features").insertMany(features);
    
    console.log("✅ Seeded landing page content successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
