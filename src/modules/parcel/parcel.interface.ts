import { ObjectId } from "mongodb";

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
    | "returned"
    | "not_collected"
    | "picked_up";

  assigned_rider_id?: ObjectId;
  assigned_rider_name?: string;
  assigned_rider_email?: string;
  assigned_rider_phone?: string;

  picked_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  return_reason?: string;

  // Multi-Role Support
  merchantId?: ObjectId;
  requiredVehicle?: "bike" | "car" | "mini_pickup" | "large_pickup";
  codAmount?: number;
}

export interface TrackingUpdate {
  _id?: ObjectId;
  trackingId: string;
  status: string;
  details: string;
  location: string;
  time: string;
}
