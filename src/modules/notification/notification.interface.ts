import { ObjectId } from "mongodb";

export interface INotification {
  _id?: ObjectId;
  email: string; // Recipient email
  message: string;
  time: string; // ISO timestamp
  isRead: boolean;
  type: "status_update" | "payment" | "admin_alert" | string;
}
