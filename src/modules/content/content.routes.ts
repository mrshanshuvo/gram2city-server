import { Router } from "express";
import multer from "multer";

import {
  getPublicSettings,
  getContentConfig,
  updateContentConfig,
  getStats,
  getWarehouses,
} from "./settings/settings.controller";

import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "./banners/banners.controller";

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "./services/services.controller";

import {
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
} from "./features/features.controller";

import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "./partners/partners.controller";

import {
  getProcessSteps,
  createProcessStep,
  updateProcessStep,
  deleteProcessStep,
} from "./process-steps/process-steps.controller";

import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "./testimonials/testimonials.controller";

import {
  subscribeNewsletter,
  getNewsletterSubscribers,
} from "./newsletter/newsletter.controller";

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
  contentConfigUpdateSchema,
} from "./content.schema";

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

const parseNestedBody = (req: any, _res: any, next: any) => {
  if (req.body) {
    const result: any = {};
    for (const key in req.body) {
      const value = req.body[key];
      if (key.includes("[")) {
        const parts = key.split(/[\[\]]+/).filter(Boolean);
        const isArray = key.endsWith("[]");
        let current = result;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            if (isArray) {
              current[part] = current[part] || [];
              if (Array.isArray(value)) {
                current[part].push(...value);
              } else {
                current[part].push(value);
              }
            } else {
              current[part] = value;
            }
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        }
      } else {
        result[key] = value;
      }
    }
    req.body = result;
  }
  next();
};

// ─── PUBLIC GENERAL ROUTES ──────────────────────────────────────────────────
router.get("/public/settings", getPublicSettings);

// ─── LANDING PAGE PUBLIC ROUTES ──────────────────────────────────────────────
router.get("/landing/process-steps", getProcessSteps);
router.get("/landing/config", getContentConfig);
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
  upload.single("ogImage"),
  parseNestedBody,
  validate(contentConfigUpdateSchema),
  updateContentConfig,
);
router.get(
  "/landing/newsletter",
  verifyFBToken,
  verifyAdmin,
  getNewsletterSubscribers,
);

// ─── LANDING ELEMENTS CRUD ADMIN ROUTES ──────────────────────────────────────

// Banners CRUD
router.post(
  "/landing/banners",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(bannerSchema),
  createBanner,
);
router.patch(
  "/landing/banners/:id",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(bannerSchema),
  updateBanner,
);
router.delete("/landing/banners/:id", verifyFBToken, verifyAdmin, deleteBanner);

// Services CRUD
router.post(
  "/landing/services",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(serviceSchema),
  createService,
);
router.patch(
  "/landing/services/:id",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(serviceSchema),
  updateService,
);
router.delete(
  "/landing/services/:id",
  verifyFBToken,
  verifyAdmin,
  deleteService,
);

// Features CRUD
router.post(
  "/landing/features",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(featureSchema),
  createFeature,
);
router.patch(
  "/landing/features/:id",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(featureSchema),
  updateFeature,
);
router.delete(
  "/landing/features/:id",
  verifyFBToken,
  verifyAdmin,
  deleteFeature,
);

// Partners CRUD
router.post(
  "/landing/partners",
  verifyFBToken,
  verifyAdmin,
  upload.single("logo"),
  validate(partnerSchema),
  createPartner,
);
router.patch(
  "/landing/partners/:id",
  verifyFBToken,
  verifyAdmin,
  upload.single("logo"),
  validate(partnerSchema),
  updatePartner,
);
router.delete(
  "/landing/partners/:id",
  verifyFBToken,
  verifyAdmin,
  deletePartner,
);

// Process Steps CRUD
router.post(
  "/landing/process-steps",
  verifyFBToken,
  verifyAdmin,
  validate(processStepSchema),
  createProcessStep,
);
router.patch(
  "/landing/process-steps/:id",
  verifyFBToken,
  verifyAdmin,
  validate(processStepSchema),
  updateProcessStep,
);
router.delete(
  "/landing/process-steps/:id",
  verifyFBToken,
  verifyAdmin,
  deleteProcessStep,
);

// Testimonials CRUD
router.post(
  "/landing/testimonials",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(testimonialSchema),
  createTestimonial,
);
router.patch(
  "/landing/testimonials/:id",
  verifyFBToken,
  verifyAdmin,
  upload.single("image"),
  validate(testimonialSchema),
  updateTestimonial,
);
router.delete(
  "/landing/testimonials/:id",
  verifyFBToken,
  verifyAdmin,
  deleteTestimonial,
);

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
