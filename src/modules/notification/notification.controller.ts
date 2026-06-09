import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { notificationsCollection } from "../../db/db";
import { io } from "../../socket/socket";
import { INotification } from "./notification.interface";

// ─── Internal Notification Utility ──────────────────────────────────────────
export const createNotification = async (
  notification: Omit<INotification, "_id" | "time" | "isRead"> & { time?: string }
): Promise<INotification> => {
  const newNotification: INotification = {
    email: notification.email,
    message: notification.message,
    type: notification.type,
    time: notification.time || new Date().toISOString(),
    isRead: false,
  };

  const result = await notificationsCollection.insertOne(newNotification);
  const savedNotification = { ...newNotification, _id: result.insertedId };

  if (io) {
    io.to(notification.email).emit("new_notification", savedNotification);
  }

  return savedNotification;
};

// ─── Controller Handlers ─────────────────────────────────────────────────────

export const getUserNotifications = async (req: Request, res: Response) => {
  const { email } = req.params;
  if (req.user?.email !== email) {
    return res.status(403).send({ success: false, message: "Unauthorized" });
  }

  try {
    const notifications = await notificationsCollection
      .find({ email, isRead: false })
      .sort({ time: -1 })
      .toArray();

    res.send(notifications);
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { isRead: true } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to mark notification as read" });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  const { email } = req.params;
  if (req.user?.email !== email) {
    return res.status(403).send({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await notificationsCollection.updateMany(
      { email, isRead: false },
      { $set: { isRead: true } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to mark all as read" });
  }
};
