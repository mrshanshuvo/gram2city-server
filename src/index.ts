import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import admin from "firebase-admin";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

// ─── Env Validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = [
  "MONGODB_URI",
  "DB_NAME",
  "FB_SERVICE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_CURRENCY",
  "CLIENT_URL",
  "IMGBB_API_KEY",
  "FB_WEB_API_KEY",
] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

// ─── Firebase Admin ───────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FB_SERVICE_KEY as string, "base64").toString("utf8"),
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

// ─── Professional Middlewares ────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Request logging
app.use(compression()); // Gzip compression
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
import usersRouter from "./routes/users";
import parcelsRouter from "./routes/parcels";
import ridersRouter from "./routes/riders";
import paymentsRouter from "./routes/payments";
import trackingsRouter from "./routes/trackings";
import reviewsRouter from "./routes/reviews";
import notificationsRouter from "./routes/notifications";
import cashoutsRouter from "./routes/cashouts";
import uploadsRouter from "./routes/uploads";
import authRouter from "./routes/auth";

app.get("/", (_req, res) => res.send("Parcel website server is running"));
app.use("/", usersRouter);
app.use("/", parcelsRouter);
app.use("/", ridersRouter);
app.use("/", paymentsRouter);
app.use("/", trackingsRouter);
app.use("/", reviewsRouter);
app.use("/", notificationsRouter);
app.use("/", cashoutsRouter);
app.use("/", uploadsRouter);
app.use("/", authRouter);

// ─── Centralized Error Handler ───────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Global Error:", err.stack);
  res.status(500).send({
    success: false,
    message: "A server error occurred. Please try again later.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ─── Swagger Documentation ────────────────────────────────────────────────────
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

export default app;
