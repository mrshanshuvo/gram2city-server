import { ObjectId } from "mongodb";

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
