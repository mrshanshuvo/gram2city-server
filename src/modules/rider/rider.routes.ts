import { Router } from "express";
import {
  submitApplication,
  getAllRiders,
  getAssignedParcels,
  updateParcelDeliveryStatus,
  getRiderReviews,
  getRiderStats,
  requestPayout,
} from "./rider.controller";
import { verifyFBToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { riderApplicationSchema } from "./rider.schema";

const router = Router();

router.post("/riders", verifyFBToken, validate(riderApplicationSchema), submitApplication);
router.get("/riders", verifyFBToken, getAllRiders);
router.get("/rider/parcels", verifyFBToken, getAssignedParcels);
router.patch("/rider/parcels/:id/status", verifyFBToken, updateParcelDeliveryStatus);
router.get("/reviews", verifyFBToken, getRiderReviews);
router.get("/rider/stats", verifyFBToken, getRiderStats);
router.post("/payout", verifyFBToken, requestPayout);

export default router;
