import { ObjectId, InsertOneResult, UpdateResult, DeleteResult } from "mongodb";
import {
  settingsCollection,
  trackingCollection,
  processStepsCollection,
  landingConfigCollection,
  bannersCollection,
  servicesCollection,
  featuresCollection,
  partnersCollection,
  testimonialsCollection,
  warehousesCollection,
  newsletterCollection,
  ridersCollection,
  merchantsCollection,
  usersCollection,
  parcelCollection,
} from "../../db/db";
import {
  ProcessStep,
  LandingConfig,
  BannerSlide,
  ServiceItem,
  FeatureItem,
  PartnerLogo,
  Warehouse,
  Merchant,
} from "./public.interface";

const collectionMap: { [key: string]: any } = {
  banners: bannersCollection,
  services: servicesCollection,
  features: featuresCollection,
  partners: partnersCollection,
  "process-steps": processStepsCollection,
  testimonials: testimonialsCollection,
};

export class PublicService {
  // Public general endpoints
  static async getPublicSettings() {
    return settingsCollection.findOne({});
  }

  static async getPublicTracking(trackingId: string) {
    return trackingCollection.find({ trackingId }).sort({ time: -1 }).toArray();
  }

  // Landing endpoints
  static async getProcessSteps(showAll?: boolean): Promise<ProcessStep[]> {
    const query = showAll ? {} : { isActive: true };
    return (await processStepsCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as ProcessStep[];
  }

  static async getLandingConfig(): Promise<LandingConfig | null> {
    return landingConfigCollection.findOne(
      {},
    ) as unknown as LandingConfig | null;
  }

  static async updateLandingConfig(
    update: Partial<LandingConfig>,
  ): Promise<void> {
    await landingConfigCollection.updateOne(
      {},
      { $set: update },
      { upsert: true },
    );
  }

  static async getBanners(showAll?: boolean): Promise<BannerSlide[]> {
    const query = showAll ? {} : { isActive: true };
    return (await bannersCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as BannerSlide[];
  }

  static async getServices(showAll?: boolean): Promise<ServiceItem[]> {
    const query = showAll ? {} : { isActive: true };
    return (await servicesCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as ServiceItem[];
  }

  static async getFeatures(showAll?: boolean): Promise<FeatureItem[]> {
    const query = showAll ? {} : { isActive: true };
    return (await featuresCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as FeatureItem[];
  }

  static async getPartners(showAll?: boolean): Promise<PartnerLogo[]> {
    const query = showAll ? {} : { isActive: true };
    return (await partnersCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as PartnerLogo[];
  }

  static async getTestimonials(showAll?: boolean): Promise<any[]> {
    const query = showAll ? {} : { isActive: true };
    return testimonialsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getStats() {
    const warehouses = await warehousesCollection.find({}).toArray();
    const totalDistricts = [...new Set(warehouses.map((w) => w.district))];
    const activeHubs = warehouses.filter((w) => w.status === "active").length;
    const expressZones = warehouses.filter(
      (w) => w.status === "limited",
    ).length;
    const approvedRiders = await ridersCollection.countDocuments({
      status: "approved",
    });

    return {
      districts: totalDistricts.length || 64,
      activeHubs: activeHubs || 0,
      expressZones: expressZones || 0,
      riders: approvedRiders || 0,
    };
  }

  static async subscribeNewsletter(email: string) {
    const existing = await newsletterCollection.findOne({ email });
    if (existing) {
      return { success: false, message: "Already subscribed!" };
    }

    await newsletterCollection.insertOne({
      email,
      subscribedAt: new Date().toISOString(),
    });

    return { success: true, message: "Welcome to the family!" };
  }

  static async getNewsletterSubscribers(): Promise<any[]> {
    return newsletterCollection.find({}).sort({ subscribedAt: -1 }).toArray();
  }

  static async getWarehouses(filter: {
    search?: string;
    district?: string;
    status?: string;
  }): Promise<Warehouse[]> {
    const query: any = {};

    if (filter.search) {
      query.$or = [
        { district: { $regex: filter.search, $options: "i" } },
        { city: { $regex: filter.search, $options: "i" } },
        { region: { $regex: filter.search, $options: "i" } },
      ];
    }

    if (filter.district) query.district = filter.district;
    if (filter.status) query.status = filter.status;

    return (await warehousesCollection
      .find(query)
      .toArray()) as unknown as Warehouse[];
  }

  // Merchant operations
  static async applyMerchant(merchantData: Omit<Merchant, "_id">) {
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

    const newMerchant: Merchant = {
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

  static async getMerchantProfile(email: string): Promise<Merchant | null> {
    return (await merchantsCollection.findOne({
      email,
    })) as unknown as Merchant | null;
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

  // Generic landing CRUD helpers
  static async createLandingItem(
    name: string,
    item: any,
  ): Promise<InsertOneResult> {
    const collection = collectionMap[name];
    if (!collection) throw new Error(`Collection not found for: ${name}`);

    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    return collection.insertOne(item);
  }

  static async updateLandingItem(
    name: string,
    id: string,
    update: any,
  ): Promise<UpdateResult> {
    const collection = collectionMap[name];
    if (!collection) throw new Error(`Collection not found for: ${name}`);

    return collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
  }

  static async deleteLandingItem(
    name: string,
    id: string,
  ): Promise<DeleteResult> {
    const collection = collectionMap[name];
    if (!collection) throw new Error(`Collection not found for: ${name}`);

    return collection.deleteOne({ _id: new ObjectId(id) });
  }
}
