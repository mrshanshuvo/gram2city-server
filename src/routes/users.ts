import { Router } from "express";
import { usersCollection, parcelCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import type { User } from "../types";

const router = Router();

// GET /users/search
router.get("/users/search", verifyFBToken, verifyAdmin, async (req, res) => {
  const emailQuery = req.query.email as string | undefined;
  if (!emailQuery)
    return res.status(400).send({ error: "Email query is required" });
  try {
    const users = await usersCollection
      .find({ email: { $regex: emailQuery, $options: "i" } })
      .project({ email: 1, createdAt: 1, role: 1 })
      .limit(10)
      .toArray();
    res.send(users);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /users/:email/role
router.get("/users/:email/role", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  try {
    const user = await usersCollection.findOne(
      { email },
      { projection: { role: 1 } },
    );
    if (!user)
      return res.status(404).send({ success: false, message: "User not found" });
    res.send({ success: true, role: user.role || "user" });
  } catch {
    res.status(500).send({ success: false, error: "Internal Server Error" });
  }
});

// PATCH /users/:email/role
router.patch(
  "/users/:email/role",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    const { email } = req.params;
    const { role } = req.body;
    try {
      const result = await usersCollection.updateOne(
        { email },
        { $set: { role } },
      );
      res.send({ success: true, modifiedCount: result.modifiedCount });
    } catch {
      res.status(500).send({ success: false, error: "Failed to update role" });
    }
  },
);

// PATCH /users/:email  (update profile)
router.patch("/users/:email", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  const { name, photoURL, phone, address } = req.body;
  if (req.user.email !== email)
    return res.status(403).send({ success: false, message: "Unauthorized" });
  try {
    const result = await usersCollection.updateOne(
      { email },
      { $set: { name, photoURL, phone, address } },
    );
    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch {
    res.status(500).send({ success: false, error: "Failed to update profile" });
  }
});

// POST /users  (upsert on login)
router.post("/users", verifyFBToken, async (req, res) => {
  const email = req.user.email;
  if (!email) {
    return res.status(400).send({ success: false, message: "Email not found in token" });
  }

  const user = req.body;
  const updateDoc = {
    $setOnInsert: {
      name: user.name,
      photoURL: user.photoURL,
      role: "user" as const,
      created_at: new Date().toISOString(),
    },
    $set: {
      last_login: new Date().toISOString(),
      ...(user.name && { name: user.name }),
      ...(user.photoURL && { photoURL: user.photoURL }),
    },
  };

  try {
    const result = await usersCollection.updateOne(
      { email },
      updateDoc,
      { upsert: true },
    );
    res.send({ success: true, ...result });
  } catch (error) {
    console.error("Error upserting user:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// GET /user/stats/:email
router.get("/user/stats/:email", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  try {
    const stats = await parcelCollection
      .aggregate([
        { $match: { created_by: email } },
        {
          $group: {
            _id: null,
            totalBooked: { $sum: 1 },
            unpaidCount: {
              $sum: { $cond: [{ $ne: ["$payment_status", "paid"] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ["$payment_status", "paid"] }, "$cost", 0],
              },
            },
          },
        },
      ])
      .toArray();
    res.send({
      totalBooked: stats[0]?.totalBooked || 0,
      unpaidCount: stats[0]?.unpaidCount || 0,
      totalSpent: stats[0]?.totalSpent || 0,
    });
  } catch {
    res.status(500).send({ error: "Failed to fetch user stats" });
  }
});

export default router;
