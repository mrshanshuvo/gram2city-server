import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ParcelService } from "./parcel.service";
import { Parcel } from "./parcel.interface";
import { io } from "../../socket/socket";
import { uploadToCloudinary } from "../../utils/upload";
import { usersCollection } from "../../db/db";
import { createNotification } from "../notification/notification.controller";

export const getMyParcels = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email as string;
    const { payment_status, delivery_status } = req.query;

    const parcels = await ParcelService.getMyParcels(
      email,
      payment_status as string,
      delivery_status as string,
    );

    res.send({ success: true, count: parcels.length, data: parcels });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch your parcels." });
  }
};

export const getMyParcelStats = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email as string;
    const stats = await ParcelService.getMyParcelStats(email);
    res.send({ success: true, stats });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to calculate stats." });
  }
};

export const bookParcel = async (req: Request, res: Response) => {
  try {
    const {
      parcelName,
      parcelType,
      weight,
      receiverName,
      receiverPhone,
      deliveryAddress,
      receiverDistrict,
      senderPhone,
      deliveryDate,
      requiredVehicle = "bike",
      merchantId,
      codAmount,
    } = req.body;

    if (
      !parcelName ||
      !weight ||
      !receiverName ||
      !receiverPhone ||
      !deliveryAddress ||
      !receiverDistrict
    ) {
      return res
        .status(400)
        .send({ success: false, message: "Missing required fields." });
    }

    const weightNum = Number(weight);
    const { totalCost, riderEarning, adminProfit } =
      await ParcelService.calculateCost(weightNum, requiredVehicle as string);

    const trackingId = `G2C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newParcel: Parcel = {
      trackingId,
      parcelName,
      parcelType,
      created_by: req.user?.email as string,
      creation_date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      weight: weightNum,
      parcelWeight: weightNum,
      receiverName,
      receiverPhone,
      receiverPhoneNumber: receiverPhone,
      deliveryAddress,
      receiverDistrict,
      receiverRegion: receiverDistrict,
      senderPhone,
      senderContact: senderPhone,
      senderDistrict: req.body.senderDistrict || "",
      senderRegion: req.body.senderDistrict || "",
      senderName: req.body.senderName || req.user?.name || "Anonymous",
      deliveryDate,
      cost: totalCost,
      rider_earning: riderEarning,
      admin_profit: adminProfit,
      payment_status: "unpaid",
      delivery_status: "pending",
      requiredVehicle: requiredVehicle as any,
      merchantId: merchantId ? new ObjectId(String(merchantId)) : undefined,
      codAmount: codAmount ? Number(codAmount) : undefined,
    };

    const result = await ParcelService.bookParcel(newParcel);

    if (io) {
      io.emit("new_parcel", {
        trackingId,
        sender: newParcel.senderName,
        destination: newParcel.receiverDistrict,
        cost: totalCost,
      });
    }

    // Persistent notification for all admins
    const admins = await usersCollection
      .find({ role: { $in: ["admin", "superAdmin"] } })
      .toArray();
    for (const adminUser of admins) {
      await createNotification({
        email: adminUser.email,
        message: `New Shipment: Parcel ${trackingId} booked by ${newParcel.senderName} to ${newParcel.receiverDistrict} (৳${totalCost}).`,
        type: "admin_alert",
      });
    }

    res.status(201).send({
      success: true,
      message: "Parcel booked successfully!",
      trackingId,
      cost: totalCost,
      id: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to book parcel." });
  }
};

export const getParcelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = req.user?.email as string;

    const parcel = await ParcelService.getParcelById(id as string);

    if (!parcel) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found." });
    }

    if (parcel.created_by !== email && (req.user as any).role !== "admin") {
      return res
        .status(403)
        .send({ success: false, message: "Unauthorized access." });
    }

    res.send({ success: true, data: parcel });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch parcel." });
  }
};

export const updateParcel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = req.user?.email as string;
    const updateData = req.body;

    const parcel = await ParcelService.getParcelById(id as string);

    if (!parcel) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found." });
    }

    if (parcel.created_by !== email) {
      return res.status(403).send({ success: false, message: "Unauthorized." });
    }

    if (parcel.delivery_status !== "pending") {
      return res.status(400).send({
        success: false,
        message: "Cannot update a parcel that is already in transit.",
      });
    }

    if (updateData.weight) {
      const weightNum = Number(updateData.weight);
      const { totalCost, riderEarning, adminProfit } =
        await ParcelService.calculateCost(weightNum, parcel.requiredVehicle);

      updateData.cost = totalCost;
      updateData.rider_earning = riderEarning;
      updateData.admin_profit = adminProfit;
      updateData.parcelWeight = weightNum;
    }

    if (updateData.receiverPhone)
      updateData.receiverPhoneNumber = updateData.receiverPhone;
    if (updateData.receiverDistrict)
      updateData.receiverRegion = updateData.receiverDistrict;

    await ParcelService.updateParcel(id as string, updateData);

    res.send({ success: true, message: "Parcel updated successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update parcel." });
  }
};

export const deleteParcel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = req.user?.email as string;

    const parcel = await ParcelService.getParcelById(id as string);

    if (!parcel)
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found." });

    if (parcel.created_by !== email) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized to cancel this parcel.",
      });
    }

    if (parcel.delivery_status !== "pending") {
      return res.status(400).send({
        success: false,
        message:
          "Cannot cancel a parcel that is already assigned or in transit.",
      });
    }

    await ParcelService.deleteParcel(id as string);

    // Notify assigned rider if any, otherwise notify admins
    if (parcel.assigned_rider_email) {
      await createNotification({
        email: parcel.assigned_rider_email,
        message: `Cancellation: Parcel "${parcel.parcelName}" (${parcel.trackingId}) assigned to you has been cancelled by the sender.`,
        type: "admin_alert",
      });
    } else {
      const admins = await usersCollection
        .find({ role: { $in: ["admin", "superAdmin"] } })
        .toArray();
      for (const adminUser of admins) {
        await createNotification({
          email: adminUser.email,
          message: `Parcel Cancelled: "${parcel.parcelName}" (${parcel.trackingId}) was cancelled by ${email}.`,
          type: "admin_alert",
        });
      }
    }

    res.send({ success: true, message: "Parcel cancelled successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to cancel parcel." });
  }
};

export const markPicked = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await ParcelService.markPicked(id as string);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found" });
    }

    res.send({ success: true, message: "Parcel picked up successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to mark as picked" });
  }
};

export const bulkIngestParcels = async (req: Request, res: Response) => {
  try {
    const { parcels, merchantId } = req.body;
    if (!Array.isArray(parcels))
      return res
        .status(400)
        .send({ success: false, message: "Invalid data format" });

    const newParcels = parcels.map(
      (p: any) =>
        ({
          trackingId: `G2C-B-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          parcelName: p.parcelName || "Bulk Item",
          parcelType: p.parcelType || "Package",
          created_by: req.user?.email as string,
          creation_date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          weight: Number(p.weight) || 1,
          parcelWeight: Number(p.weight) || 1,
          receiverName: p.receiverName,
          receiverPhone: p.receiverPhone,
          receiverPhoneNumber: p.receiverPhone,
          deliveryAddress: p.deliveryAddress,
          receiverDistrict: p.receiverDistrict,
          receiverRegion: p.receiverDistrict,
          senderName: req.user?.name || "Merchant",
          senderPhone: p.senderPhone || "",
          cost: Number(p.cost) || 50,
          payment_status: "unpaid" as const,
          delivery_status: "pending" as const,
          merchantId: merchantId ? new ObjectId(String(merchantId)) : undefined,
          codAmount: Number(p.codAmount) || 0,
        }) as Parcel,
    );

    await ParcelService.bulkIngestParcels(
      newParcels,
      req.user?.email as string,
    );

    res.status(201).send({
      success: true,
      message: `${newParcels.length} parcels uploaded successfully.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to process bulk upload" });
  }
};

export const markDelivered = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await ParcelService.markDelivered(id as string);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Parcel not found" });
    }

    res.send({ success: true, message: "Parcel delivered successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to mark as delivered" });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "No file uploaded or file type not supported",
    });
  }

  try {
    const url = await uploadToCloudinary(req.file, "gram2city/parcels");
    res.send({ success: true, url });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to upload image" });
  }
};

export const getAllParcels = async (req: Request, res: Response) => {
  try {
    const { delivery_status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;

    const { parcels, totalItems } = await ParcelService.getAllParcels(
      {
        delivery_status: delivery_status as string,
        startDate: startDate as string,
        endDate: endDate as string,
      },
      page,
      size,
    );

    const totalPages = Math.ceil(totalItems / size);

    res.send({
      status: "success",
      data: parcels,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit: size,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch all parcels" });
  }
};
