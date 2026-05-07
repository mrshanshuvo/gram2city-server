import { z } from "zod";

export const feedbackSchema = z.object({
  body: z.object({
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().min(5, "Feedback must be at least 5 characters"),
    category: z.enum(["service", "app", "rider", "other"]),
    userName: z.string().optional(),
  }),
});

export const reviewSchema = z.object({
  body: z.object({
    rider_email: z.string().email(),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().optional(),
    parcelId: z.string().optional(),
  }),
});

export const paymentSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1, "Parcel ID is required"),
    paymentMethod: z.string().optional(),
    amount: z.coerce.number().positive(),
    transactionId: z.string().optional(),
  }),
});

export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const trackingSchema = z.object({
  body: z.object({
    trackingId: z.string().min(1, "Tracking ID is required"),
    status: z.string().min(1, "Status is required"),
    details: z.string().min(1, "Details are required"),
    location: z.string().optional(),
  }),
});
