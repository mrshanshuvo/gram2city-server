require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error("❌ MONGODB_URI or DB_NAME is missing in environment variables.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB.");

    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);

    const collections = await db.listCollections({ name: "addresses" }).toArray();
    if (collections.length === 0) {
      console.log("ℹ️ Collection 'addresses' does not exist.");
    } else {
      await db.collection("addresses").drop();
      console.log("✅ Collection 'addresses' has been dropped successfully.");
    }
  } catch (error) {
    console.error("❌ Error dropping collection:", error);
  } finally {
    await client.close();
    console.log("🔌 Connection closed.");
  }
}

main();
