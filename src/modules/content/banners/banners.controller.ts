import { Request, Response } from "express";
  import { ObjectId } from "mongodb";
  import { BannersService } from "./banners.service";
  import { bannersCollection } from "../../../db/db";
  import { uploadToCloudinary } from "../../../utils/upload";

  export const getBanners = async (req: Request, res: Response) => {
    try {
      const showAll = req.query.all === "true";
      const banners = await BannersService.getBanners(showAll);
      res.send({ success: true, data: banners });
    } catch (error) {
      res.status(500).send({ success: false, message: "Server error" });
    }
  };

  export const createBanner = async (req: Request, res: Response) => {
    try {
      const item = req.body;
      if (req.file) {
        item.image = await uploadToCloudinary(req.file, "gram2city/banners");
      }
      if (item.isActive === undefined) item.isActive = true;
      item.createdAt = new Date().toISOString();

      const result = await bannersCollection.insertOne(item);
      res.send({ success: true, data: { ...item, _id: result.insertedId } });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message || "Failed to create banner",
      });
    }
  };

  export const updateBanner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const update = req.body;
      delete update._id;

      if (req.file) {
        update.image = await uploadToCloudinary(req.file, "gram2city/banners");
      }

      const result = await bannersCollection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: update },
      );
      if (result.matchedCount === 0) {
        return res.status(404).send({ success: false, message: "Not found" });
      }
      res.send({ success: true, message: "Banner updated" });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message || "Failed to update banner",
      });
    }
  };

  export const deleteBanner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await bannersCollection.deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount === 0) {
        return res.status(404).send({ success: false, message: "Not found" });
      }
      res.send({ success: true, message: "Banner deleted" });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message || "Failed to delete banner",
      });
    }
  };
  
