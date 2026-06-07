import { Router } from "express";
import multer from "multer";
import {
  getPublicSettings,
  getPublicTracking,
  getProcessSteps,
  getLandingConfig,
  updateLandingConfig,
  getBanners,
  getServices,
  getFeatures,
  getPartners,
  getTestimonials,
  getStats,
  subscribeNewsletter,
  getNewsletterSubscribers,
  getWarehouses,
  applyMerchant,
  getMerchantProfile,
  getMerchantStats,
  createLandingItem,
  updateLandingItem,
  deleteLandingItem,
} from "./public.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  newsletterSchema,
  bannerSchema,
  serviceSchema,
  featureSchema,
  partnerSchema,
  testimonialSchema,
  processStepSchema,
  landingConfigUpdateSchema,
} from "./public.schema";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// ─── PUBLIC GENERAL ROUTES ──────────────────────────────────────────────────
router.get("/public/settings", getPublicSettings);
router.get("/public/tracking/:trackingId", getPublicTracking);

// ─── LANDING PAGE PUBLIC ROUTES ──────────────────────────────────────────────
router.get("/landing/process-steps", getProcessSteps);
router.get("/landing/config", getLandingConfig);
router.get("/landing/banners", getBanners);
router.get("/landing/services", getServices);
router.get("/landing/features", getFeatures);
router.get("/landing/partners", getPartners);
router.get("/landing/testimonials", getTestimonials);
router.get("/landing/stats", getStats);
router.post(
  "/landing/subscribe",
  validate(newsletterSchema),
  subscribeNewsletter,
);
router.get("/landing/warehouses", getWarehouses);

// ─── LANDING CONFIG ADMIN ROUTES ─────────────────────────────────────────────
router.patch(
  "/landing/config",
  verifyFBToken,
  verifyAdmin,
  validate(landingConfigUpdateSchema),
  updateLandingConfig,
);
router.get(
  "/landing/newsletter",
  verifyFBToken,
  verifyAdmin,
  getNewsletterSubscribers,
);

// ─── MERCHANT ONBOARDING & PERFORMANCE ───────────────────────────────────────
router.post("/merchants", verifyFBToken, applyMerchant);
router.get("/merchants/me", verifyFBToken, getMerchantProfile);
router.get("/merchants/stats", verifyFBToken, getMerchantStats);

// ─── LANDING ELEMENTS CRUD ADMIN ROUTES ──────────────────────────────────────
const registerCRUD = (name: string, schema?: any, imageField?: string) => {
  const middleware: any[] = [];
  if (imageField) middleware.push(upload.single(imageField));
  if (schema) middleware.push(validate(schema));

  router.post(
    `/landing/${name}`,
    verifyFBToken,
    verifyAdmin,
    ...middleware,
    createLandingItem,
  );
  router.patch(
    `/landing/${name}/:id`,
    verifyFBToken,
    verifyAdmin,
    ...middleware,
    updateLandingItem,
  );
  router.delete(
    `/landing/${name}/:id`,
    verifyFBToken,
    verifyAdmin,
    deleteLandingItem,
  );
};

registerCRUD("banners", bannerSchema, "image");
registerCRUD("services", serviceSchema, "image");
registerCRUD("features", featureSchema, "image");
registerCRUD("partners", partnerSchema, "logo");
registerCRUD("process-steps", processStepSchema);
registerCRUD("testimonials", testimonialSchema, "image");

// ─── Multer Error Handler ──────────────────────────────────────────────────
router.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .send({ success: false, message: "File too large. Max limit is 5MB." });
    }
    return res.status(400).send({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).send({ success: false, message: err.message });
  }
  next();
});

export default router;
