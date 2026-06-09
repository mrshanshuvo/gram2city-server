import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import {
  usersCollection,
  merchantsCollection,
  ridersCollection,
} from "../db/db";

// ─── Token Verification ───────────────────────────────────────────────────────

export const verifyFBToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res
      .status(401)
      .send({ success: false, message: "Unauthorized: No token provided" });
    return;
  }

  // Robust token extraction: Remove "Bearer" (case-insensitive) and any leading/trailing spaces
  const token = authHeader
    .replace(/^Bearer\s+/i, "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    res
      .status(401)
      .send({ success: false, message: "Unauthorized: Invalid token format" });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ success: false, message: "Unauthorized" });
  }
};

// ─── Admin Guard ──────────────────────────────────────────────────────────────

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const email = req.user.email;
  const user = await usersCollection.findOne({ email });
  if (user?.role !== "admin") {
    res.status(403).send({ success: false, message: "Forbidden" });
    return;
  }
  next();
};

// ─── Role-Based Guards ────────────────────────────────────────────────────────

export const verifyMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const email = req.user.email;
  const user = await usersCollection.findOne({ email });

  if (user?.role === "merchant") {
    return next();
  }

  if (user?.role === "admin") {
    const merchantProfile = await merchantsCollection.findOne({
      $or: [{ userId: user._id }, { email }],
    });
    if (merchantProfile) {
      return next();
    }
  }

  res.status(403).send({ success: false, message: "Merchant access required" });
};

export const verifyRider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const email = req.user.email;
  const user = await usersCollection.findOne({ email });

  if (user?.role === "rider") {
    return next();
  }

  if (user?.role === "admin") {
    const riderProfile = await ridersCollection.findOne({
      $or: [{ userId: user?._id }, { email }],
    });
    if (riderProfile) {
      return next();
    }
  }

  res.status(403).send({ success: false, message: "Rider access required" });
};
