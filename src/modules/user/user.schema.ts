import { z } from "zod";

export const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    photoURL: z.string().url("Invalid photo URL").optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    photoURL: z.string().url("Invalid photo URL").optional(),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
      .optional(),
    address: z
      .string()
      .min(5, "Address must be at least 5 characters")
      .optional(),
  }),
});

export const userStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "suspended"]),
  }),
});
