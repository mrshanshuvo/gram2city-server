import { Router } from "express";
import { trackingCollection } from "../db";

const router = Router();

// GET /trackings/:trackingId
router.get("/trackings/:trackingId", async (req, res) => {
  const { trackingId } = req.params;
  const updates = await trackingCollection
    .find({ trackingId })
    .sort({ time: -1 })
    .toArray();
  res.send(updates);
});

// POST /trackings
router.post("/trackings", async (req, res) => {
  const update = req.body;
  update.time = new Date().toISOString();
  if (!update.trackingId)
    return res
      .status(400)
      .send({ success: false, message: "Missing trackingId" });
  const result = await trackingCollection.insertOne(update);
  res.status(201).send(result);
});

export default router;
