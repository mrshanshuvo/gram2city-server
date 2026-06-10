import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { FeaturesService } from "./features.service";
import { featuresCollection } from "../../../db/db";
import { uploadToCloudinary } from "../../../utils/upload";

export const getFeatures = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const features = await FeaturesService.getFeatures(showAll);
    res.send({ success: true, data: features });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const createFeature = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (req.file) {
      item.image = await uploadToCloudinary(req.file, "gram2city/features");
    }
    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    const result = await featuresCollection.insertOne(item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create feature",
    });
  }
};

export const updateFeature = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    if (req.file) {
      update.image = await uploadToCloudinary(req.file, "gram2city/features");
    }

    const result = await featuresCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Feature updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update feature",
    });
  }
};

export const deleteFeature = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await featuresCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Feature deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete feature",
    });
  }
};
