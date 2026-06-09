import { Router } from "express";
import {
  submitApplication,
  getAllRiders,
  getAssignedParcels,
  updateParcelDeliveryStatus,
  getRiderReviews,
  getRiderStats,
  requestPayout,
  updateRiderStatus,
} from "./rider.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  riderApplicationSchema,
  updateRiderStatusSchema,
} from "./rider.schema";

const router = Router();

router.post(
  "/riders",
  verifyFBToken,
  validate(riderApplicationSchema),
  submitApplication,
);
router.get("/riders", verifyFBToken, getAllRiders);
router.patch(
  "/riders/:id/status",
  verifyFBToken,
  verifyAdmin,
  validate(updateRiderStatusSchema),
  updateRiderStatus,
);
router.get("/rider/parcels", verifyFBToken, getAssignedParcels);
router.patch(
  "/rider/parcels/:id/status",
  verifyFBToken,
  updateParcelDeliveryStatus,
);
router.get("/reviews", verifyFBToken, getRiderReviews);
router.get("/rider/stats", verifyFBToken, getRiderStats);
router.post("/payout", verifyFBToken, requestPayout);

export default router;
