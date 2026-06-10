import { Router } from "express";
import { getAllFeedback } from "./feedback.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";

const router = Router();

router.get("/feedback", verifyFBToken, verifyAdmin, getAllFeedback);

export default router;
