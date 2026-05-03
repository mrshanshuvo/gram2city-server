import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { usersCollection } from "../db";

// ─── Token Verification ───────────────────────────────────────────────────────

export const verifyFBToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ success: false, message: "Unauthorized" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).send({ success: false, message: "Unauthorized" });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
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
