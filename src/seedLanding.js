require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function seed() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    
    // 1. Banners
    const banners = [
      {
        title: "Express Delivery from Village to City",
        subtitle: "Fast, reliable, and secure. We bridge the gap with our high-speed logistics network, ensuring your parcels reach any destination in record time.",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070",
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
        image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=1974",
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
        image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070",
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
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070",
        icon: "Truck",
        isActive: true,
        order: 1
      },
      {
        title: "Elite Safety & Handling",
        description: "Your trust is our priority. We employ multi-layered security protocols and specialized handling equipment.",
        image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=2070",
        icon: "ShieldCheck",
        isActive: true,
        order: 2
      },
      {
        title: "24/7 Dedicated Support",
        description: "Logistics never sleeps, and neither do we. Our expert support team is always on standby to resolve queries.",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072",
        icon: "Headset",
        isActive: true,
        order: 3
      }
    ];

    // 4. Partners
    const partners = [
      { name: "FedEx", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/FedEx_Logo.svg", isActive: true, order: 1 },
      { name: "DHL", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/DHL_Logo.svg", isActive: true, order: 2 },
      { name: "UPS", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/UPS_logo_2014.svg", isActive: true, order: 3 },
      { name: "Aramex", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Aramex_logo.svg", isActive: true, order: 4 },
      { name: "PostOffice", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Royal_Mail_logo.svg", isActive: true, order: 5 },
    ];

    // 5. Process Steps
    const processSteps = [
      {
        title: "Book Your Parcel",
        description: "Choose your service, fill in recipient details, and book your parcel in seconds through our seamless dashboard.",
        icon: "Calendar",
        steps: ["Create an account", "Fill recipient details", "Choose service type"],
        isActive: true,
        order: 1
      },
      {
        title: "Secure Pickup",
        description: "Our dedicated riders will collect your parcel right from your doorstep with specialized handling protocols.",
        icon: "CircleDollarSign",
        steps: ["Rider assignment", "Secure packaging", "Barcode scanning"],
        isActive: true,
        order: 2
      },
      {
        title: "Swift Delivery",
        description: "Your parcel travels through our high-speed network to reach its destination safely and right on time.",
        icon: "Truck",
        steps: ["Hub sorting", "Express transit", "Proof of delivery"],
        isActive: true,
        order: 3
      },
      {
        title: "Manage Hubs",
        description: "Our localized hubs ensure that every district is covered efficiently, providing a localized touch to your logistics.",
        icon: "Building2",
        steps: ["Local storage", "Last-mile routing", "Inventory tracking"],
        isActive: true,
        order: 4
      }
    ];

    // 6. Global Landing Config
    const landingConfig = {
      howItWorksHeader: {
        title: "Seamless Logistics from Start to Finish",
        subtitle: "We've simplified the shipping process so you can focus on what matters most. Our technology-driven approach ensures precision at every step."
      },
      howItWorksFooter: "Logistics is not just about moving boxes; it's about moving lives and growing businesses with every mile we travel.",
      merchantSection: {
        title: "Merchant and Customer Satisfaction is Our First Priority",
        description: "We offer the most competitive delivery rates with unparalleled value. Gram2City ensures your parcels reach every corner of the nation with 100% safety and precision.",
        benefits: ["Nationwide Coverage", "Fastest Settlement", "Cash on Delivery", "Real-time Dashboard"],
        ctaText: "Become a Merchant",
        ctaLink: "/register"
      },
      contactInfo: {
        address: "123 Hub Center, Dhaka, Bangladesh",
        email: "support@gram2city.com",
        phone: "+880 1234 567890",
        socials: {
          facebook: "https://facebook.com/gram2city",
          twitter: "https://twitter.com/gram2city",
          linkedin: "https://linkedin.com/company/gram2city"
        }
      }
    };

    await db.collection("banners").deleteMany({});
    await db.collection("banners").insertMany(banners);
    
    await db.collection("services").deleteMany({});
    await db.collection("services").insertMany(services);
    
    await db.collection("features").deleteMany({});
    await db.collection("features").insertMany(features);

    await db.collection("partners").deleteMany({});
    await db.collection("partners").insertMany(partners);

    await db.collection("process_steps").deleteMany({});
    await db.collection("process_steps").insertMany(processSteps);

    await db.collection("landing_config").deleteMany({});
    await db.collection("landing_config").insertOne(landingConfig);
    
    console.log("✅ Seeded all landing page content successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
