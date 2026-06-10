import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { TestimonialsService } from "./testimonials.service";
import { testimonialsCollection } from "../../../db/db";
import { uploadToCloudinary } from "../../../utils/upload";

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const testimonials = await TestimonialsService.getTestimonials(showAll);
    res.send({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (req.file) {
      item.image = await uploadToCloudinary(req.file, "gram2city/testimonials");
    }
    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    const result = await testimonialsCollection.insertOne(item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create testimonial",
    });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    if (req.file) {
      update.image = await uploadToCloudinary(req.file, "gram2city/testimonials");
    }

    const result = await testimonialsCollection.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Testimonial updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update testimonial",
    });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await testimonialsCollection.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Testimonial deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete testimonial",
    });
  }
};
