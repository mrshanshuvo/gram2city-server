import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ProcessStepsService } from "./process-steps.service";
import { processStepsCollection } from "../../../db/db";

export const getProcessSteps = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const steps = await ProcessStepsService.getProcessSteps(showAll);
    res.send({ success: true, data: steps });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const createProcessStep = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    const result = await processStepsCollection.insertOne(item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create process step",
    });
  }
};

export const updateProcessStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    const result = await processStepsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Process step updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update process step",
    });
  }
};

export const deleteProcessStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await processStepsCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Process step deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete process step",
    });
  }
};
