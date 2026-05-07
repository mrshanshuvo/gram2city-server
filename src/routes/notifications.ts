import { Router } from "express";
import { ObjectId } from "mongodb";
import { notificationsCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /notifications/{email}:
 *   get:
 *     summary: Get unread notifications for a user
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "email", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
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

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "id", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
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

/**
 * @swagger
 * /notifications/read-all/{email}:
 *   patch:
 *     summary: Mark all notifications for a user as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "email", in: path, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
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
