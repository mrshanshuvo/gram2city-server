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
