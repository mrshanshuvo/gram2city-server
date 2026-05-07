import { z } from "zod";

export const adminSettingsSchema = z.object({
  body: z.object({
    base_delivery_fee: z.coerce.number().min(0).optional(),
    cost_per_kg: z.coerce.number().min(0).optional(),
    rider_commission_percentage: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const announceSchema = z.object({
  body: z.object({
    message: z.string().min(5, "Announcement must be at least 5 characters"),
  }),
});

export const userStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "suspended"]),
  }),
});

export const assignRiderSchema = z.object({
  body: z.object({
    riderId: z.string().min(1, "Rider ID is required"),
  }),
});
