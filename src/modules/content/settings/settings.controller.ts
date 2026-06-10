import { Request, Response } from "express";
import { SettingsService } from "./settings.service";
import { uploadToCloudinary } from "../../../utils/upload";

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SettingsService.getPublicSettings();
    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getContentConfig = async (req: Request, res: Response) => {
  try {
    const config = await SettingsService.getContentConfig();
    res.send({ success: true, data: config });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const updateContentConfig = async (req: Request, res: Response) => {
  try {
    const update = req.body;
    delete update._id;

    // If an OG image file was uploaded, push it to Cloudinary and store the URL
    if (req.file) {
      update.seo = update.seo || {};
      update.seo.image = await uploadToCloudinary(req.file, "gram2city/config");
    }

    await SettingsService.updateContentConfig(update);
    res.send({ success: true, message: "Configuration updated" });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update config" });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await SettingsService.getStats();
    res.send({ success: true, data: stats });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error fetching stats" });
  }
};

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const { search, district, status } = req.query;
    const data = await SettingsService.getWarehouses({
      search: search as string,
      district: district as string,
      status: status as string,
    });
    res.send({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Error fetching warehouses" });
  }
};
