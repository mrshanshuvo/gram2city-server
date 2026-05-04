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
      .project({ email: 1, createdAt: 1, role: 1, name: 1, photoURL: 1 })
      .limit(10)
      .toArray();
    res.send(users);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /users/staff (List all admins)
router.get("/users/staff", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const staff = await usersCollection
      .find({ role: { $in: ["admin", "superAdmin"] } })
      .project({ email: 1, role: 1, name: 1, last_login: 1 })
      .toArray();
    res.send(staff);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /users/summary (Role distribution)
router.get("/summary", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const stats = await usersCollection.aggregate([
      {
        $facet: {
          roleCounts: [
            { $group: { _id: "$role", count: { $sum: 1 } } }
          ],
          recentlyJoined: [
            { $match: { created_at: { $gte: sevenDaysAgo.toISOString() } } },
            { $count: "count" }
          ],
          activeToday: [
            { $match: { last_login: { $gte: startOfToday.toISOString() } } },
            { $count: "count" }
          ]
        }
      }
    ]).toArray();

    const roleMap = stats[0].roleCounts.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.send({
      success: true,
      superAdmin: roleMap.superAdmin || 0,
      admin: roleMap.admin || 0,
      user: roleMap.user || 0,
      rider: roleMap.rider || 0,
      recentlyJoined: stats[0].recentlyJoined[0]?.count || 0,
      activeToday: stats[0].activeToday[0]?.count || 0,
      total: (roleMap.user || 0) + (roleMap.admin || 0) + (roleMap.superAdmin || 0) + (roleMap.rider || 0)
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch summary" });
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

// POST /users (Register new user)
router.post("/users", verifyFBToken, async (req, res) => {
  const email = req.user.email;
  if (!email) {
    return res
      .status(400)
      .send({ success: false, message: "Email not found in token" });
  }

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return res
      .status(200)
      .send({ success: true, message: "User already exists", existing: true });
  }

  const name = req.body.name || req.user.name;
  const photoURL = req.body.photoURL || req.user.picture;

  const newUser: User = {
    email,
    name,
    photoURL,
    role: "user",
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  try {
    const result = await usersCollection.insertOne(newUser);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// POST /users/sync (Automatic sync for every login/refresh)
router.post("/users/sync", verifyFBToken, async (req, res) => {
  const email = req.user.email;
  if (!email)
    return res.status(401).send({ success: false, message: "Unauthorized" });

  const name = req.body.name || req.user.name;
  const photoURL = req.body.photoURL || req.user.picture;

  const updateDoc: any = {
    $setOnInsert: {
      email,
      role: "user",
      created_at: new Date().toISOString(),
    },
    $set: {
      last_login: new Date().toISOString(),
    },
  };

  if (name) {
    updateDoc.$set.name = name;
  }
  if (photoURL) {
    updateDoc.$set.photoURL = photoURL;
  }

  try {
    await usersCollection.updateOne({ email }, updateDoc, {
      upsert: true,
    });
    const user = await usersCollection.findOne({ email });
    res.send({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
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
