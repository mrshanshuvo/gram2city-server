const { MongoClient } = require("mongodb");

async function run() {
  const uri =
    "mongodb://zap_shift_user:nmNkXTqfJEfO2n1p@ac-4xay6dy-shard-00-00.ezlz7xu.mongodb.net:27017,ac-4xay6dy-shard-00-01.ezlz7xu.mongodb.net:27017,ac-4xay6dy-shard-00-02.ezlz7xu.mongodb.net:27017/?tls=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("parcelDB");
    const collection = db.collection("banners");

    const updates = [
      {
        order: 1,
        update: {
          image: "https://i.ibb.co/MTfSsMT/banner1.jpg",
          color: "from-black/80 via-black/40 to-transparent",
          title: "Express Delivery Nationwide",
          subtitle:
            "Fast, secure, and reliable shipping from the heart of the village to the center of the city.",
        },
      },
      {
        order: 2,
        update: {
          image: "https://i.ibb.co/6cdyZxy9/banner2.jpg",
          color: "from-black/80 via-black/40 to-transparent",
          title: "Smart Business Logistics",
          subtitle:
            "Empowering Bangladeshi merchants with seamless supply chain solutions and real-time tracking.",
        },
      },
      {
        order: 3,
        update: {
          image: "https://i.ibb.co/YFKz4wN2/banner3.jpg",
          color: "from-black/80 via-black/40 to-transparent",
          title: "Real-Time Tracking Mastery",
          subtitle:
            "Watch your parcels move across the map with pinpoint accuracy and complete transparency.",
        },
      },
    ];

    for (const item of updates) {
      const result = await collection.updateOne(
        { order: item.order },
        { $set: item.update },
      );
      console.log(
        `Updated banner ${item.order}: ${result.modifiedCount} modified`,
      );
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
