import { Router } from "express";
import { ObjectId } from "mongodb";
import { notificationsCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();

// GET /notifications/:email
router.get("/notifications/:email", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  if (req.user.email !== email)
    return res.status(403).send({ success: false, message: "Unauthorized" });
  try {
    const notifications = await notificationsCollection
      .find({ email, isRead: false })
      .sort({ time: -1 })
      .toArray();
    res.send(notifications);
  } catch {
    res.status(500).send({ error: "Failed to fetch notifications" });
  }
});

// PATCH /notifications/:id/read
router.patch("/notifications/:id/read", verifyFBToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: { isRead: true } },
    );
    res.send(result);
  } catch {
    res.status(500).send({ error: "Failed to mark as read" });
  }
});

// PATCH /notifications/read-all/:email
router.patch(
  "/notifications/read-all/:email",
  verifyFBToken,
  async (req, res) => {
    const { email } = req.params;
    if (req.user.email !== email)
      return res.status(403).send({ success: false, message: "Unauthorized" });
    try {
      const result = await notificationsCollection.updateMany(
        { email, isRead: false },
        { $set: { isRead: true } },
      );
      res.send(result);
    } catch {
      res.status(500).send({ error: "Failed to mark all as read" });
    }
  },
);

export default router;
