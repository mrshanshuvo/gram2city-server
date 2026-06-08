import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) {
    console.error("Missing MONGODB_URI or DB_NAME in env");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const messagesCol = db.collection("messages");
  
  const conversations = await messagesCol
    .aggregate([
      {
        $match: {
          $or: [{ senderEmail: "admin@gram2city.com" }, { receiverEmail: "admin@gram2city.com" }],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverEmail", "admin@gram2city.com"] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.timestamp": -1 } },
    ])
    .toArray();

  console.log("Conversations found:", JSON.stringify(conversations, null, 2));
  await client.close();
}

main().catch(console.error);
