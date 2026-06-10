import {
  ObjectId,
  UpdateResult,
  InsertOneResult,
  InsertManyResult,
  DeleteResult,
} from "mongodb";
import {
  usersCollection,
  parcelCollection,
  avatarsCollection,
  merchantsCollection,
  auditCollection,
} from "../../db/db";
import { createNotification } from "../notification/notification.controller";
import { User, Avatar, UserStats } from "./user.interface";

export class UserService {
  static async searchUsers(emailQuery: string): Promise<User[]> {
    return (await usersCollection
      .find({ email: { $regex: emailQuery, $options: "i" } })
      .project({ email: 1, createdAt: 1, role: 1, name: 1, photoURL: 1 })
      .limit(10)
      .toArray()) as unknown as User[];
  }

  static async getStaffList(): Promise<User[]> {
    return (await usersCollection
      .find({ role: { $in: ["admin", "superAdmin"] } })
      .project({ email: 1, role: 1, name: 1, last_login: 1 })
      .toArray()) as unknown as User[];
  }

  static async getUsersSummary() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const stats = await usersCollection
      .aggregate([
        {
          $facet: {
            roleCounts: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
            recentlyJoined: [
              { $match: { created_at: { $gte: sevenDaysAgo.toISOString() } } },
              { $count: "count" },
            ],
            activeToday: [
              { $match: { last_login: { $gte: startOfToday.toISOString() } } },
              { $count: "count" },
            ],
          },
        },
      ])
      .toArray();

    const roleMap = stats[0].roleCounts.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      superAdmin: roleMap.superAdmin || 0,
      admin: roleMap.admin || 0,
      user: roleMap.user || 0,
      rider: roleMap.rider || 0,
      recentlyJoined: stats[0].recentlyJoined[0]?.count || 0,
      activeToday: stats[0].activeToday[0]?.count || 0,
      total:
        (roleMap.user || 0) +
        (roleMap.admin || 0) +
        (roleMap.superAdmin || 0) +
        (roleMap.rider || 0),
    };
  }

  static async updateUserRole(
    email: string,
    role: string,
  ): Promise<UpdateResult> {
    return usersCollection.updateOne(
      { email },
      { $set: { role: role as any } },
    );
  }

  static async updateUserProfile(
    email: string,
    updateData: Partial<User>,
  ): Promise<UpdateResult> {
    return usersCollection.updateOne({ email }, { $set: updateData });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return (await usersCollection.findOne({ email })) as unknown as User | null;
  }

  static async createUserRecord(newUser: User): Promise<InsertOneResult> {
    return usersCollection.insertOne(newUser);
  }

  static async syncUser(email: string, updateDoc: any): Promise<void> {
    await usersCollection.updateOne({ email }, updateDoc, {
      upsert: true,
    });
  }

  static async getUserStats(email: string): Promise<UserStats> {
    const stats = await parcelCollection
      .aggregate([
        { $match: { created_by: email } },
        {
          $group: {
            _id: null,
            totalBooked: { $sum: 1 },
            unpaidCount: {
              $sum: { $cond: [{ $ne: ["$payment_status", "paid"] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ["$payment_status", "paid"] }, "$cost", 0],
              },
            },
          },
        },
      ])
      .toArray();

    return {
      totalBooked: stats[0]?.totalBooked || 0,
      unpaidCount: stats[0]?.unpaidCount || 0,
      totalSpent: stats[0]?.totalSpent || 0,
    };
  }

  static async getRandomAvatar(): Promise<Avatar | { url: string }> {
    const avatars = (await avatarsCollection
      .find({ isActive: true })
      .toArray()) as unknown as Avatar[];
    if (avatars.length === 0) {
      return {
        url:
          "https://api.dicebear.com/7.x/lorelei/svg?seed=" +
          Math.random().toString(36).substring(7),
      };
    }
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  }

  static async getAllAvatars(): Promise<Avatar[]> {
    return (await avatarsCollection
      .find({ isActive: true })
      .toArray()) as unknown as Avatar[];
  }

  static async addAvatar(
    avatar: Omit<Avatar, "_id">,
  ): Promise<InsertOneResult> {
    return avatarsCollection.insertOne(avatar);
  }

  static async magicGenerateAvatars(
    newAvatars: Omit<Avatar, "_id">[],
  ): Promise<InsertManyResult> {
    return avatarsCollection.insertMany(newAvatars);
  }

  static async deleteAvatar(id: string): Promise<DeleteResult> {
    return avatarsCollection.deleteOne({ _id: new ObjectId(id) });
  }


  static async updateUserStatus(
    email: string,
    status: string,
    adminEmail: string,
  ): Promise<void> {
    await usersCollection.updateOne(
      { email },
      { $set: { status: status as any } },
    );

    await auditCollection.insertOne({
      admin_email: adminEmail,
      action: "USER_STATUS_CHANGE",
      target_id: email,
      details: `Changed user ${email} status to ${status}`,
      timestamp: new Date().toISOString(),
    });
  }

  static async getMerchants(status?: string): Promise<any[]> {
    const query: any = {};
    if (status) query.status = status;

    const pipeline = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userName: { $ifNull: ["$userDetails.name", "$name"] },
          email: { $ifNull: ["$userDetails.email", "$email"] },
          userPhoto: "$userDetails.photoURL",
        },
      },
      { $project: { userDetails: 0 } },
    ];

    return merchantsCollection.aggregate(pipeline).toArray();
  }

  static async updateMerchantStatus(
    id: string,
    status: string,
    adminEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    const merchant = await merchantsCollection.findOne({
      _id: new ObjectId(String(id)),
    });
    if (!merchant) {
      return { success: false, message: "Merchant not found" };
    }

    await merchantsCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: status as any, updatedAt: new Date().toISOString() } },
    );

    if (status === "approved") {
      await usersCollection.updateOne(
        { email: merchant.email },
        { $set: { role: "merchant" } },
      );
    }

    if (merchant.email) {
      await createNotification({
        email: merchant.email,
        message: `Application Update: Your application to become a Merchant for "${merchant.businessName}" has been ${status}.`,
        type: "admin_alert",
      });
    }

    await auditCollection.insertOne({
      admin_email: adminEmail,
      action: "MERCHANT_STATUS_CHANGE",
      target_id: id,
      details: `Changed merchant ${merchant.businessName} status to ${status}`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Merchant status updated to ${status}` };
  }

  static async applyMerchant(merchantData: any) {
    const existing = await merchantsCollection.findOne({
      email: merchantData.email,
    });
    if (existing) {
      return {
        success: false,
        message: "A merchant application already exists for this email.",
      };
    }

    const user = await usersCollection.findOne({ email: merchantData.email });
    if (!user) {
      return { success: false, message: "User not found in system." };
    }

    const newMerchant = {
      ...merchantData,
      userId: user._id as ObjectId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const result = await merchantsCollection.insertOne(newMerchant);
    return {
      success: true,
      message: "Application submitted successfully and is pending approval.",
      merchantId: result.insertedId,
    };
  }

  static async getMerchantProfile(email: string) {
    return merchantsCollection.findOne({ email });
  }

  static async getMerchantStats(email: string) {
    const merchant = await this.getMerchantProfile(email);
    if (!merchant) {
      return null;
    }

    const stats = await parcelCollection
      .aggregate([
        { $match: { merchantId: merchant._id } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalCODCollected: {
              $sum: {
                $cond: [
                  { $eq: ["$delivery_status", "delivered"] },
                  "$codAmount",
                  0,
                ],
              },
            },
            pendingCOD: {
              $sum: {
                $cond: [
                  { $ne: ["$delivery_status", "delivered"] },
                  "$codAmount",
                  0,
                ],
              },
            },
            deliveredCount: {
              $sum: {
                $cond: [{ $eq: ["$delivery_status", "delivered"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    return (
      stats[0] || {
        totalBookings: 0,
        totalCODCollected: 0,
        pendingCOD: 0,
        deliveredCount: 0,
      }
    );
  }
}

