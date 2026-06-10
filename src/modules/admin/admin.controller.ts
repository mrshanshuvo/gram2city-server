import { Request, Response } from "express";
import { AdminService } from "./admin.service";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AdminService.getAuditLogs();
    res.send({ success: true, logs });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch logs" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getStats();
    res.send({ success: true, stats });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to aggregate stats" });
  }
};

export const announce = async (req: Request, res: Response) => {
  const { message } = req.body;
  try {
    const userCount = await AdminService.createAnnouncement(
      message,
      req.user?.email as string,
    );
    res.send({
      success: true,
      message: `Announcement sent to ${userCount} users.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to send announcement" });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminService.getSettings();
    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { base_delivery_fee, cost_per_kg, rider_commission_percentage } =
    req.body;
  try {
    await AdminService.updateSettings(
      { base_delivery_fee, cost_per_kg, rider_commission_percentage },
      req.user?.email as string,
    );
    res.send({ success: true, message: "Settings updated and logged." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update settings" });
  }
};

export const getFleet = async (req: Request, res: Response) => {
  try {
    const fleetStats = await AdminService.getFleetDistribution();
    res.send({ success: true, data: fleetStats });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch fleet stats" });
  }
};
