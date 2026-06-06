import { ObjectId } from "mongodb";

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
