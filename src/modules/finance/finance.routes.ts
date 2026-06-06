import { Router } from "express";
import {
  getPaymentHistory,
  createPaymentIntent,
  recordPayment,
  getCashoutHistory,
} from "./finance.controller";
import { verifyFBToken } from "../../middleware/auth";
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

export default router;
