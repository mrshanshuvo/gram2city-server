import { Request, Response } from "express";
import { FinanceService } from "./finance.service";

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email as string;
    const payments = await FinanceService.getPaymentHistory(email);
    res.send({ success: true, data: payments });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch payment history" });
  }
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount, parcelId } = req.body;
  try {
    const clientSecret = await FinanceService.createPaymentIntent(
      amount,
      parcelId,
      req.user?.email as string,
    );
    res.json({ clientSecret });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment intent.",
    });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { parcelId, transactionId, amount, paymentMethod } = req.body;
    const email = req.user?.email as string;

    if (!parcelId || !transactionId || !amount) {
      return res
        .status(400)
        .send({ success: false, message: "Missing payment information" });
    }

    const result = await FinanceService.recordPayment(
      { parcelId, transactionId, amount, paymentMethod },
      email,
    );

    if (!result.success) {
      return res.status(400).send(result);
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal server error" });
  }
};

export const getCashoutHistory = async (req: Request, res: Response) => {
  const rider_email = req.query.rider_email as string | undefined;
  if (!rider_email) {
    return res
      .status(400)
      .send({ success: false, message: "Missing rider_email" });
  }
  try {
    const result = await FinanceService.getCashoutHistory(rider_email);
    res.send(result);
  } catch (err) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getPayouts = async (req: Request, res: Response) => {
  try {
    const payouts = await FinanceService.getPayouts();
    res.send({ success: true, data: payouts });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch payouts" });
  }
};

export const updatePayoutStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await FinanceService.updatePayoutStatus(
      id as string,
      status,
      req.user?.email as string,
    );
    if (!result.success) {
      return res.status(404).send(result);
    }
    res.send(result);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update payout status" });
  }
};
