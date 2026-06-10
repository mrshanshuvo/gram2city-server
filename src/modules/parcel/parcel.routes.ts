import { Router } from "express";
import multer from "multer";
import {
  getMyParcels,
  getMyParcelStats,
  bookParcel,
  getParcelById,
  updateParcel,
  deleteParcel,
  markPicked,
  bulkIngestParcels,
  markDelivered,
  uploadImage,
  getAllParcels,
} from "./parcel.controller";
import {
  getTrackingHistory,
  getRecentTrackings,
  addManualTrackingUpdate,
  getPublicTracking,
} from "./tracking/tracking.controller";
import { assignRider } from "./assignment/assignment.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  parcelSchema,
  updateParcelSchema,
  trackingSchema,
  assignRiderSchema,
} from "./parcel.schema";

const router = Router();

// Multer Configuration for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// Parcel Routes
router.get("/parcels", verifyFBToken, getMyParcels);
router.get("/parcels/stats", verifyFBToken, getMyParcelStats);
router.get("/parcels/all", verifyFBToken, verifyAdmin, getAllParcels);
router.post("/parcels", verifyFBToken, validate(parcelSchema), bookParcel);
router.get("/parcels/:id", verifyFBToken, getParcelById);
router.patch(
  "/parcels/:id/assign",
  verifyFBToken,
  verifyAdmin,
  validate(assignRiderSchema),
  assignRider,
);
router.patch(
  "/parcels/:id",
  verifyFBToken,
  validate(updateParcelSchema),
  updateParcel,
);
router.delete("/parcels/:id", verifyFBToken, deleteParcel);

// Rider Operations
router.patch("/parcels/:id/pick", verifyFBToken, markPicked);
router.patch("/parcels/:id/deliver", verifyFBToken, markDelivered);

// Merchant Bulk Upload
router.post("/parcels/bulk", verifyFBToken, bulkIngestParcels);

// Tracking Routes
router.get("/trackings/:trackingId", getTrackingHistory);
router.get("/public/tracking/:trackingId", getPublicTracking);
router.get(
  "/trackings/all/recent",
  verifyFBToken,
  verifyAdmin,
  getRecentTrackings,
);
router.post(
  "/trackings",
  verifyFBToken,
  verifyAdmin,
  validate(trackingSchema),
  addManualTrackingUpdate,
);

// Image Uploads Route
router.post("/upload", verifyFBToken, upload.single("image"), uploadImage);

// Multer Error Handler
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
