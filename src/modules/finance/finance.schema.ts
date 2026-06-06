import { z } from "zod";

export const paymentSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1, "Parcel ID is required"),
    paymentMethod: z.string().optional(),
    amount: z.coerce.number().positive(),
    transactionId: z.string().optional(),
  }),
});
