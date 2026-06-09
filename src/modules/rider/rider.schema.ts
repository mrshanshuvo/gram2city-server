import { z } from "zod";

export const riderApplicationSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
    nid: z
      .string()
      .regex(/^(?:\d{10}|\d{13}|\d{17})$/, "NID must be 10, 13 or 17 digits"),
    age: z.coerce
      .number()
      .min(18, "Must be at least 18")
      .max(70, "Must be under 70"),
    bikeBrand: z.string().min(2, "Brand name too short"),
    bikeRegNo: z.string().min(5, "Invalid registration number"),
    region: z.string().min(1, "Region is required"),
    district: z.string().min(1, "District is required"),
    additionalInfo: z.string().optional(),
  }),
});

export const updateRiderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    email: z.string().optional(),
  }),
});
