import "dotenv/config";
import express from "express";
import cors from "cors";
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
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
import usersRouter from "./routes/users";
import parcelsRouter from "./routes/parcels";
import ridersRouter from "./routes/riders";
import paymentsRouter from "./routes/payments";
import trackingsRouter from "./routes/trackings";
import reviewsRouter from "./routes/reviews";
import notificationsRouter from "./routes/notifications";
import cashoutsRouter from "./routes/cashouts";

app.get("/", (_req, res) => res.send("Parcel website server is running"));
app.use("/", usersRouter);
app.use("/", parcelsRouter);
app.use("/", ridersRouter);
app.use("/", paymentsRouter);
app.use("/", trackingsRouter);
app.use("/", reviewsRouter);
app.use("/", notificationsRouter);
app.use("/", cashoutsRouter);

// ─── Swagger Documentation ────────────────────────────────────────────────────
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
