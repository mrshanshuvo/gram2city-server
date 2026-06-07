import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      { message: "MONGODB_URI must be a valid MongoDB connection string" },
    ),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  FB_SERVICE_KEY: z.string().min(1, "FB_SERVICE_KEY is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_CURRENCY: z.string().default("usd"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  FB_WEB_API_KEY: z.string().min(1, "FB_WEB_API_KEY is required"),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
};

export const config = parseEnv();
export type Config = z.infer<typeof envSchema>;
