import { Router } from "express";
import {
  getPaymentHistory,
  createPaymentIntent,
  recordPayment,
  getCashoutHistory,
  getPayouts,
  updatePayoutStatus,
} from "./finance.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { paymentSchema } from "./finance.schema";

const router = Router();

router.get("/payments", verifyFBToken, getPaymentHistory);
router.post(
  "/create-payment-intent",
  verifyFBToken,
  validate(paymentSchema),
  createPaymentIntent,
);
router.post("/payments", verifyFBToken, validate(paymentSchema), recordPayment);
router.get("/cashouts", verifyFBToken, getCashoutHistory);

// Admin Payout Routes
router.get("/payouts", verifyFBToken, verifyAdmin, getPayouts);
router.patch("/payouts/:id/status", verifyFBToken, verifyAdmin, updatePayoutStatus);

export default router;
