import { ObjectId } from "mongodb";
import type * as admin from "firebase-admin";

// ─── MongoDB Document Interfaces ────────────────────────────────────────────

export interface User {
  _id?: ObjectId;
  email: string;
  name?: string;
  photoURL?: string;
  role?: "user" | "admin" | "rider" | "superAdmin";
  phone?: string;
  address?: string;
  status?: "active" | "suspended" | "pending"; // Added: User status management
  emailVerified?: boolean; // Added: Synced from Firebase
  created_at?: string;
  last_login?: string;
}

export interface Parcel {
  _id?: ObjectId;
  trackingId: string;
  parcelName: string;
  parcelType?: string;
  created_by: string; // User Email
  weight: number; 
  parcelWeight?: number; // Alias for weight used in frontend
  creation_date?: string;
  createdAt?: string;

  senderName?: string; // Added: For UI display
  senderAddress?: string;
  senderPhone?: string;
  senderContact?: string; // Alias for senderPhone used in frontend
  senderDistrict?: string;
  senderRegion?: string; // Alias for senderDistrict used in frontend
  senderServiceCenter?: string;
  deliveryDate?: string;

  receiverName: string;
  receiverPhone: string;
  receiverPhoneNumber?: string; // Alias for receiverPhone used in frontend
  deliveryAddress: string;
  receiverDistrict?: string;
  receiverRegion?: string; // Alias for receiverDistrict used in frontend
  receiverServiceCenter?: string;

  cost: number;
  rider_earning?: number;
  admin_profit?: number;
  payment_status?: "paid" | "unpaid";
  delivery_status?:
    | "pending"
    | "assigned"
    | "on_the_way"
    | "delivered"
    | "cancelled"
    | "returned";

  assigned_rider_id?: ObjectId;
  assigned_rider_name?: string;
  assigned_rider_email?: string;
  assigned_rider_phone?: string;

  picked_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  return_reason?: string;
}

export interface Rider {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  district?: string;
  region?: string;
  status: "pending" | "approved" | "rejected";

  // Rider Metrics (Added for Admin Dashboard)
  average_rating?: number;
  total_delivered?: number;
  is_available?: boolean;
}

export interface Payment {
  _id?: ObjectId;
  parcelId: ObjectId;
  email: string; // Customer Email
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
  comment?: string;
  date?: string;
  parcelId?: string;
  user_email?: string;
  [key: string]: unknown;
}

export interface Notification {
  _id?: ObjectId;
  email: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "status_update" | "payment" | "admin_alert" | string;
}

// ─── NEW: Administrative Intelligence ────────────────────────────────────────

export interface AuditLog {
  _id?: ObjectId;
  admin_email: string;
  action: string; // e.g., "ROLE_CHANGE", "PARCEL_CANCEL", "RIDER_APPROVAL"
  target_id?: string | ObjectId;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface SystemSettings {
  _id?: ObjectId;
  base_delivery_fee: number;
  cost_per_kg: number;
  rider_commission_percentage: number;
  updated_at: string;
  updated_by: string;
}

// ─── Express Request Augmentation ───────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user: admin.auth.DecodedIdToken;
    }
  }
}
