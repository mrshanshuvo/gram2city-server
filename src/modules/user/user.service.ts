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
  addressesCollection,
} from "../../db/db";
import { User, Avatar, UserStats, Address } from "./user.interface";

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

  static async getAddresses(email: string): Promise<Address[]> {
    return (await addressesCollection
      .find({ userEmail: email })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray()) as unknown as Address[];
  }

  static async addAddress(
    address: Omit<Address, "_id">,
    email: string,
  ): Promise<InsertOneResult> {
    if (address.isDefault) {
      await addressesCollection.updateMany(
        { userEmail: email },
        { $set: { isDefault: false } },
      );
    }
    const newAddress: Address = {
      ...address,
      userEmail: email,
      createdAt: new Date().toISOString(),
    };
    return addressesCollection.insertOne(newAddress);
  }

  static async deleteAddress(id: string, email: string): Promise<DeleteResult> {
    return addressesCollection.deleteOne({
      _id: new ObjectId(String(id)),
      userEmail: email,
    });
  }
}
