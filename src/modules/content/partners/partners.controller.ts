import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { PartnersService } from "./partners.service";
import { partnersCollection } from "../../../db/db";
import { uploadToCloudinary } from "../../../utils/upload";

export const getPartners = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const partners = await PartnersService.getPartners(showAll);
    res.send({ success: true, data: partners });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const createPartner = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (req.file) {
      item.logo = await uploadToCloudinary(req.file, "gram2city/partners");
    }
    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    const result = await partnersCollection.insertOne(item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create partner",
    });
  }
};

export const updatePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    if (req.file) {
      update.logo = await uploadToCloudinary(req.file, "gram2city/partners");
    }

    const result = await partnersCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Partner updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update partner",
    });
  }
};

export const deletePartner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await partnersCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Partner deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete partner",
    });
  }
};
