import { Router } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import {
  parcelCollection,
  paymentCollection,
  notificationsCollection,
  addTrackingUpdate,
} from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// GET /payments?email=...
router.get("/payments", verifyFBToken, async (req, res) => {
  try {
    const email = req.query.email as string | undefined;
    if (req.user.email !== email)
      return res.status(403).send({ success: false, message: "Unauthorized" });
    const filter = email ? { email } : {};
    const payments = await paymentCollection
      .find(filter)
      .sort({ payment_time: -1 })
      .toArray();
    res.send({ success: true, data: payments });
  } catch {
    res.status(500).send({ success: false, message: "Failed to fetch payment history" });
  }
});

// POST /payments  (record payment after Stripe confirms)
router.post("/payments", verifyFBToken, async (req, res) => {
  try {
    const { parcelId, email, transactionId, amount, paymentTime, paymentMethod } =
      req.body;

    if (!parcelId || !email || !transactionId || !amount)
      return res
        .status(400)
        .send({ success: false, message: "Missing payment information" });

    const parcelUpdateResult = await parcelCollection.updateOne(
      { _id: new ObjectId(parcelId as string) },
      { $set: { payment_status: "paid" } },
    );

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(parcelId as string),
    });

    const paymentRecord = {
      parcelId: new ObjectId(parcelId as string),
      email,
      transactionId,
      amount: amount / 100,
      paymentMethod,
      paid_at: new Date().toISOString(),
      payment_time: paymentTime || new Date().toISOString(),
    };

    const paymentInsertResult = await paymentCollection.insertOne(paymentRecord);

    res.send({
      success: true,
      message: "Payment recorded, parcel marked as paid",
      data: { parcelUpdateResult, paymentInsertResult },
    });

    if (parcel) {
      await addTrackingUpdate(
        parcel.trackingId,
        "paid",
        `Payment received. Transaction ID: ${transactionId}`,
      );
      notificationsCollection.insertOne({
        email,
        message: `Payment of ৳${amount / 100} for your parcel "${parcel.parcelName}" has been received successfully.`,
        time: new Date().toISOString(),
        isRead: false,
        type: "payment",
      });
    }

    notificationsCollection.insertOne({
      email,
      message: `Payment of ৳${amount / 100} for your parcel has been received successfully.`,
      time: new Date().toISOString(),
      isRead: false,
      type: "payment",
    });
  } catch (error) {
    console.error("Error in /payments:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// POST /create-payment-intent
router.post("/create-payment-intent", async (req, res) => {
  const amount = req.body.amount;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: process.env.STRIPE_CURRENCY as string,
      payment_method_types: ["card"],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
