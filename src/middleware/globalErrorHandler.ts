import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Global Error:", err.stack);
  res.status(err.status || 500).send({
    success: false,
    message: err.message || "A server error occurred. Please try again later.",
    error: config.NODE_ENV === "development" ? err.message : undefined,
  });
};
