import { Router } from "express";
import { cashoutsCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();

// GET /cashouts?rider_email=...
/**
 * @swagger
 * /cashouts:
 *   get:
 *     summary: Get cashout history for a rider
 *     tags: [Rider Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "rider_email", in: query, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/cashouts", verifyFBToken, async (req, res) => {
  const rider_email = req.query.rider_email as string | undefined;
  if (!rider_email)
    return res
      .status(400)
      .send({ success: false, message: "Missing rider_email" });
  try {
    const result = await cashoutsCollection
      .find({ rider_email })
      .project({
        parcel_id: 1,
        trackingId: 1,
        earning: 1,
        cashed_out_at: 1,
        parcel_name: 1,
      })
      .toArray();
    res.send(result);
  } catch (err) {
    console.error("Error fetching cashouts:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

export default router;
