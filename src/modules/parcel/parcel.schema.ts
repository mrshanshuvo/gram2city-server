import { z } from "zod";

export const parcelSchema = z.object({
  body: z.object({
    parcelName: z.string().min(2, "Parcel name must be at least 2 characters"),
    parcelType: z.string().optional(),
    weight: z.coerce.number().positive("Weight must be a positive number"),
    receiverName: z
      .string()
      .min(2, "Receiver name must be at least 2 characters"),
    receiverPhone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
    deliveryAddress: z
      .string()
      .min(5, "Delivery address must be at least 5 characters"),
    receiverDistrict: z.string().min(1, "District is required"),
    senderPhone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
      .optional(),
    deliveryDate: z.string().optional(),
    senderDistrict: z.string().optional(),
    senderName: z.string().optional(),
  }),
});

export const updateParcelSchema = z.object({
  body: z.object({
    parcelName: z
      .string()
      .min(2, "Parcel name must be at least 2 characters")
      .optional(),
    parcelType: z.string().optional(),
    weight: z.coerce
      .number()
      .positive("Weight must be a positive number")
      .optional(),
    receiverName: z
      .string()
      .min(2, "Receiver name must be at least 2 characters")
      .optional(),
    receiverPhone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
      .optional(),
    deliveryAddress: z
      .string()
      .min(5, "Delivery address must be at least 5 characters")
      .optional(),
    receiverDistrict: z.string().min(1, "District is required").optional(),
    senderPhone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
      .optional(),
    deliveryDate: z.string().optional(),
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

export const assignRiderSchema = z.object({
  body: z.object({
    riderId: z.string().min(1, "Rider ID is required"),
  }),
});
