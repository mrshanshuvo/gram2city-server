import { ObjectId } from "mongodb";
import type * as admin from "firebase-admin";

// ─── MongoDB Document Interfaces ────────────────────────────────────────────

export interface User {
  _id?: ObjectId;
  email: string;
  name?: string;
  photoURL?: string;
  role?: "user" | "admin" | "rider";
  phone?: string;
  address?: string;
  created_at?: string;
  last_login?: string;
}

export interface Parcel {
  _id?: ObjectId;
  trackingId: string;
  parcelName: string;
  parcelType?: string;
  created_by: string;
  creation_date?: string;
  createdAt?: string;

  senderAddress?: string;
  senderDistrict?: string;
  senderServiceCenter?: string;

  receiverDistrict?: string;
  receiverServiceCenter?: string;

  cost: number;
  payment_status?: "paid" | "unpaid";
  delivery_status?: "pending" | "assigned" | "on_the_way" | "delivered";

  assigned_rider_id?: ObjectId;
  assigned_rider_name?: string;
  assigned_rider_email?: string;
  assigned_rider_phone?: string;
  rider_earning?: number;

  picked_at?: string;
  delivered_at?: string;
}

export interface Rider {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  district?: string;
  region?: string;
  status: "pending" | "approved" | "rejected";
}

export interface Payment {
  _id?: ObjectId;
  parcelId: ObjectId;
  email: string;
  transactionId: string;
  amount: number;
  paymentMethod?: string;
  paid_at: string;
  payment_time: string;
}

export interface Cashout {
  _id?: ObjectId;
  parcel_id: ObjectId;
  rider_email: string;
  rider_name?: string;
  earning: number;
  cashed_out_at: string;
  trackingId: string;
  parcel_name?: string;
}

export interface TrackingUpdate {
  _id?: ObjectId;
  trackingId: string;
  status: string;
  details: string;
  location: string;
  time: string;
}

export interface Review {
  _id?: ObjectId;
  rider_email: string;
  rating: number;
  date?: string;
  [key: string]: unknown; // allow extra fields from req.body
}

export interface Notification {
  _id?: ObjectId;
  email: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "status_update" | "payment" | string;
}

// ─── Express Request Augmentation ───────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user: admin.auth.DecodedIdToken;
    }
  }
}
