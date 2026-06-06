import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { config } from "../../config";
import {
  parcelCollection,
  paymentCollection,
  cashoutsCollection,
  notificationsCollection,
  addTrackingUpdate,
} from "../../db";
import { Payment } from "./finance.interface";

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // specify standard api version if needed or let it pick default
});

export class FinanceService {
  static async getPaymentHistory(email: string): Promise<Payment[]> {
    return (await paymentCollection
      .find({ email })
      .sort({ payment_time: -1 })
      .toArray()) as unknown as Payment[];
  }

  static async createPaymentIntent(amount: number, parcelId: string, email: string): Promise<string> {
    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(parcelId),
      created_by: email,
    });

    if (!parcel) {
      throw new Error("Unauthorized: You do not own this parcel.");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: config.STRIPE_CURRENCY,
      payment_method_types: ["card"],
      metadata: {
        parcelId: parcelId.toString(),
        userEmail: email,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create client secret");
    }

    return paymentIntent.client_secret;
  }

  static async recordPayment(
    data: { parcelId: string; transactionId: string; amount: number; paymentMethod?: string },
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const { parcelId, transactionId, amount, paymentMethod } = data;

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(parcelId),
      created_by: email,
    });

    if (!parcel) {
      return { success: false, message: "Unauthorized: Parcel not found or not yours." };
    }

    if (parcel.payment_status === "paid") {
      return { success: false, message: "Parcel is already paid." };
    }

    await parcelCollection.updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { payment_status: "paid" } }
    );

    const paymentRecord = {
      parcelId: new ObjectId(parcelId),
      email: email,
      transactionId,
      amount: Number(amount) / 100,
      paymentMethod: paymentMethod || "card",
      paid_at: new Date().toISOString(),
      payment_time: new Date().toISOString(),
    };

    await paymentCollection.insertOne(paymentRecord as any);

    await addTrackingUpdate(
      parcel.trackingId,
      "paid",
      `Payment received. Transaction ID: ${transactionId}`
    );

    await notificationsCollection.insertOne({
      email: email,
      message: `Payment Successful: Your parcel "${parcel.parcelName}" is now confirmed for delivery!`,
      time: new Date().toISOString(),
      isRead: false,
      type: "payment",
    });

    return { success: true, message: "Payment recorded successfully." };
  }

  static async getCashoutHistory(riderEmail: string): Promise<any[]> {
    return cashoutsCollection
      .find({ rider_email: riderEmail })
      .project({
        parcel_id: 1,
        trackingId: 1,
        earning: 1,
        cashed_out_at: 1,
        parcel_name: 1,
      })
      .toArray();
  }
}
