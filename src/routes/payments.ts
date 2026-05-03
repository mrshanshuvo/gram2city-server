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

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get my payment history
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/payments", verifyFBToken, async (req, res) => {
  try {
    const email = req.user.email;
    const payments = await paymentCollection
      .find({ email })
      .sort({ payment_time: -1 })
      .toArray();
    res.send({ success: true, data: payments });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch payment history" });
  }
});

/**
 * @swagger
 * /create-payment-intent:
 *   post:
 *     summary: Create Stripe payment intent
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [amount, parcelId]
 *             properties:
 *               amount: { type: number, example: 50 }
 *               parcelId: { type: string }
 *     responses:
 *       200: { description: "Success" }
 */
router.post("/create-payment-intent", verifyFBToken, async (req, res) => {
  const { amount, parcelId } = req.body;
  try {
    // Security: Verify parcel ownership
    const parcel = await parcelCollection.findOne({ 
      _id: new ObjectId(parcelId as string),
      created_by: req.user.email 
    });

    if (!parcel) return res.status(403).send({ success: false, message: "Unauthorized: You do not own this parcel." });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: process.env.STRIPE_CURRENCY || "usd",
      payment_method_types: ["card"],
      metadata: { parcelId: parcelId.toString(), userEmail: req.user.email as string }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create payment intent." });
  }
});

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Record successful payment
 *     tags: [Customer Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [parcelId, transactionId, amount]
 *             properties:
 *               parcelId: { type: string }
 *               transactionId: { type: string }
 *               amount: { type: number }
 *     responses:
 *       200: { description: "Success" }
 */
router.post("/payments", verifyFBToken, async (req, res) => {
  try {
    const { parcelId, transactionId, amount, paymentMethod } = req.body;
    const email = req.user.email;

    if (!parcelId || !transactionId || !amount) {
      return res.status(400).send({ success: false, message: "Missing payment information" });
    }

    // 1. Verify Ownership & Eligibility
    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(parcelId as string),
      created_by: email
    });

    if (!parcel) return res.status(403).send({ success: false, message: "Unauthorized: Parcel not found or not yours." });
    if (parcel.payment_status === "paid") return res.status(400).send({ success: false, message: "Parcel is already paid." });

    // 2. Mark Parcel as Paid
    await parcelCollection.updateOne(
      { _id: new ObjectId(parcelId as string) },
      { $set: { payment_status: "paid" } }
    );

    // 3. Record Payment Transaction
    const paymentRecord = {
      parcelId: new ObjectId(parcelId as string),
      email: email as string,
      transactionId,
      amount: Number(amount) / 100,
      paymentMethod: paymentMethod || "card",
      paid_at: new Date().toISOString(),
      payment_time: new Date().toISOString(),
    };

    await paymentCollection.insertOne(paymentRecord as any);

    // 4. Tracking & Notifications
    await addTrackingUpdate(
      parcel.trackingId,
      "paid",
      `Payment received. Transaction ID: ${transactionId}`
    );

    notificationsCollection.insertOne({
      email: email as string,
      message: `Payment Successful: Your parcel "${parcel.parcelName}" is now confirmed for delivery!`,
      time: new Date().toISOString(),
      isRead: false,
      type: "payment",
    });

    res.send({ success: true, message: "Payment recorded successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

export default router;
