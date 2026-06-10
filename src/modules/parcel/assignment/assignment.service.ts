import { ObjectId } from "mongodb";
import {
  parcelCollection,
  ridersCollection,
  usersCollection,
  addTrackingUpdate,
} from "../../../db/db";
import { createNotification } from "../../notification/notification.controller";

export class AssignmentService {
  static async assignRiderToParcel(
    parcelId: string,
    riderId: string,
    adminEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    const rider = await ridersCollection.findOne({
      _id: new ObjectId(String(riderId)),
    });
    if (!rider) {
      return { success: false, message: "Rider not found" };
    }

    const parcel = await parcelCollection.findOne({
      _id: new ObjectId(String(parcelId)),
    });
    if (!parcel) {
      return { success: false, message: "Parcel not found" };
    }

    if (
      parcel.requiredVehicle &&
      rider.vehicleType &&
      parcel.requiredVehicle !== rider.vehicleType
    ) {
      return {
        success: false,
        message: `Vehicle mismatch: Parcel requires ${parcel.requiredVehicle}, but rider has ${rider.vehicleType}.`,
      };
    }

    // Lookup user details dynamically
    const user = await usersCollection.findOne({ _id: rider.userId });
    const riderName = user?.name || rider.name || "Unknown Rider";
    const riderEmail = user?.email || rider.email || "";

    const result = await parcelCollection.updateOne(
      { _id: new ObjectId(String(parcelId)) },
      {
        $set: {
          assigned_rider_id: rider._id,
          assigned_rider_name: riderName,
          assigned_rider_email: riderEmail,
          assigned_rider_phone: rider.phone,
          delivery_status: "assigned",
        },
      },
    );

    if (result.modifiedCount === 0) {
      return { success: false, message: "Parcel not found or already updated" };
    }

    await addTrackingUpdate(
      parcel.trackingId,
      "assigned",
      `Parcel assigned to rider ${rider.name}`,
      "Admin Dashboard",
    );

    await createNotification({
      email: parcel.created_by,
      message: `Shipment Update: Your parcel "${parcel.parcelName}" has been assigned to rider ${riderName} (${rider.phone}).`,
      type: "status_update",
    });

    return { success: true, message: "Rider assigned successfully" };
  }
}
