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

export const userRoleSchema = z.object({
  body: z.object({
    role: z.enum(["user", "admin", "rider", "superAdmin"]),
  }),
});

export const adminCreateUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["user", "admin", "rider"]),
  }),
});
