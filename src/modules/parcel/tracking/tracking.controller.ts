import { Request, Response } from "express";
import { TrackingService } from "./tracking.service";

export const getTrackingHistory = async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const updates = await TrackingService.getTrackingHistory(
      trackingId as string,
    );

    if (updates.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No tracking history found for this ID.",
      });
    }

    res.send({ success: true, trackingId, history: updates });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch tracking info." });
  }
};

export const getRecentTrackings = async (req: Request, res: Response) => {
  try {
    const recentUpdates = await TrackingService.getRecentTrackings();
    res.send({ success: true, history: recentUpdates });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch recent trackings" });
  }
};

export const addManualTrackingUpdate = async (req: Request, res: Response) => {
  try {
    const { trackingId, status, details, location } = req.body;

    if (!trackingId || !status || !details) {
      return res
        .status(400)
        .send({ success: false, message: "Missing required fields" });
    }

    const result = await TrackingService.addManualTrackingUpdate(
      trackingId,
      status,
      details,
      location,
    );
    res.status(201).send({
      success: true,
      message: "Tracking update added.",
      id: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getPublicTracking = async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const history = await TrackingService.getPublicTracking(trackingId as string);
    res.send({ success: true, history });
  } catch (error) {
    res.status(500).send({ success: false, message: "Tracking failed" });
  }
};
