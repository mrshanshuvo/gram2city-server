import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ServicesService } from "./services.service";
import { servicesCollection } from "../../../db/db";
import { uploadToCloudinary } from "../../../utils/upload";

export const getServices = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const services = await ServicesService.getServices(showAll);
    res.send({ success: true, data: services });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (req.file) {
      item.image = await uploadToCloudinary(req.file, "gram2city/services");
    }
    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    const result = await servicesCollection.insertOne(item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create service",
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    if (req.file) {
      update.image = await uploadToCloudinary(req.file, "gram2city/services");
    }

    const result = await servicesCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Service updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update service",
    });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await servicesCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Service deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete service",
    });
  }
};
