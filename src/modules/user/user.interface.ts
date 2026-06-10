import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  email: string;
  name?: string;
  photoURL?: string;
  role?: "user" | "admin" | "rider" | "merchant" | "superAdmin";
  phone?: string;
  address?: string;
  status?: "active" | "suspended" | "pending";
  emailVerified?: boolean;
  isProfileComplete?: boolean;
  created_at?: string;
  last_login?: string;
}

export interface Avatar {
  _id?: ObjectId;
  url: string;
  name?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserStats {
  totalBooked: number;
  unpaidCount: number;
  totalSpent: number;
}

