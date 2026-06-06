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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "cdnjs.cloudflare.com",
          "fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(morgan("dev")); // Request logging
app.use(compression()); // Gzip compression
const clientOrigins = process.env.CLIENT_URL?.split(",") || [];
app.use(cors({ origin: clientOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for dashboard polling and development
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
import apiRouter from "./modules/app.routes";

app.get("/", (_req, res) => res.send("Parcel website server is running"));
app.use("/", apiRouter);

// ─── Centralized Error Handler ───────────────────────────────────────────────
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Global Error:", err.stack);
    res.status(500).send({
      success: false,
      message: "A server error occurred. Please try again later.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  },
);

// ─── Swagger Documentation ────────────────────────────────────────────────────
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
app.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .parameters-col_description {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 15px !important;
        width: 100% !important;
        margin-bottom: 0 !important;
      }
      /* Ensure the input field takes most of the space */
      .swagger-ui .parameters-col_description input:not([type="checkbox"]),
      .swagger-ui .parameters-col_description select {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 100px !important;
        max-width: 350px !important;
        margin: 0 !important;
      }
      /* Align ANY checkbox container (regular params or multipart toggles) */
      .swagger-ui .parameter__empty_value,
      .swagger-ui .parameter__empty_value_toggle { 
        display: flex !important; 
        flex-direction: row !important;
        align-items: center !important; 
        white-space: nowrap !important;
        margin: 0 !important;
        padding: 0 0 0 10px !important;
        flex: 0 0 auto !important;
        font-size: 11px !important;
        color: #888 !important;
      }
      .swagger-ui .parameter__empty_value input,
      .swagger-ui .parameter__empty_value_toggle input { 
        margin: 0 5px 0 0 !important; 
        width: 15px !important; 
        height: 15px !important;
        cursor: pointer !important;
      }
      /* Specific fix for the boolean select box which often overflows */
      .swagger-ui .opblock-body select {
        min-width: 100px !important;
        max-width: 200px !important;
      }
    `,
    customCssUrl: CSS_URL,
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js",
    ],
  }),
);

export default app;
