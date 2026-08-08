import { ObjectId } from 'mongodb';
import {
  SettingsModel,
  TrackingModel,
  ProcessStepModel,
  LandingConfigModel,
  BannerModel,
  ServiceModel,
  FeatureModel,
  PartnerModel,
  TestimonialModel,
  WarehouseModel,
  NewsletterModel,
  RiderModel,
  MerchantModel,
  UserModel,
  ParcelModel,
} from '../../db/models';
import {
  ProcessStep,
  LandingConfig,
  BannerSlide,
  ServiceItem,
  FeatureItem,
  PartnerLogo,
  Warehouse,
  Merchant,
} from './public.interface';

const modelMap: { [key: string]: any } = {
  banners: BannerModel,
  services: ServiceModel,
  features: FeatureModel,
  partners: PartnerModel,
  'process-steps': ProcessStepModel,
  testimonials: TestimonialModel,
};

export class PublicService {
  // Public general endpoints
  static async getPublicSettings() {
    return SettingsModel.findOne({}).lean();
  }

  static async getPublicTracking(trackingId: string) {
    return TrackingModel.find({ trackingId }).sort({ time: -1 }).lean();
  }

  // Landing endpoints
  static async getProcessSteps(showAll?: boolean): Promise<ProcessStep[]> {
    const query = showAll ? {} : { isActive: true };
    return ProcessStepModel.find(query).sort({ order: 1 }).lean() as unknown as ProcessStep[];
  }

  static async getLandingConfig(): Promise<LandingConfig | null> {
    return LandingConfigModel.findOne({}).lean() as unknown as LandingConfig | null;
  }

  static async updateLandingConfig(update: Partial<LandingConfig>): Promise<void> {
    await LandingConfigModel.updateOne({}, { $set: update }, { upsert: true });
  }

  static async getBanners(showAll?: boolean): Promise<BannerSlide[]> {
    const query = showAll ? {} : { isActive: true };
    return BannerModel.find(query).sort({ order: 1 }).lean() as unknown as BannerSlide[];
  }

  static async getServices(showAll?: boolean): Promise<ServiceItem[]> {
    const query = showAll ? {} : { isActive: true };
    return ServiceModel.find(query).sort({ order: 1 }).lean() as unknown as ServiceItem[];
  }

  static async getFeatures(showAll?: boolean): Promise<FeatureItem[]> {
    const query = showAll ? {} : { isActive: true };
    return FeatureModel.find(query).sort({ order: 1 }).lean() as unknown as FeatureItem[];
  }

  static async getPartners(showAll?: boolean): Promise<PartnerLogo[]> {
    const query = showAll ? {} : { isActive: true };
    return PartnerModel.find(query).sort({ order: 1 }).lean() as unknown as PartnerLogo[];
  }

  static async getTestimonials(showAll?: boolean): Promise<any[]> {
    const query = showAll ? {} : { isActive: true };
    return TestimonialModel.find(query).sort({ createdAt: -1 }).lean();
  }

  static async getStats() {
    const warehouses = await WarehouseModel.find({}).lean();
    const totalDistricts = [...new Set(warehouses.map((w: any) => w.district))];
    const activeHubs = warehouses.filter((w: any) => w.status === 'active').length;
    const expressZones = warehouses.filter((w: any) => w.status === 'limited').length;
    const approvedRiders = await RiderModel.countDocuments({
      status: 'approved',
    });

    return {
      districts: totalDistricts.length || 64,
      activeHubs: activeHubs || 0,
      expressZones: expressZones || 0,
      riders: approvedRiders || 0,
    };
  }

  static async subscribeNewsletter(email: string) {
    const existing = await NewsletterModel.findOne({ email }).lean();
    if (existing) {
      return { success: false, message: 'Already subscribed!' };
    }

    await NewsletterModel.create({
      email,
      subscribedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Welcome to the family!' };
  }

  static async getNewsletterSubscribers(): Promise<any[]> {
    return NewsletterModel.find({}).sort({ subscribedAt: -1 }).lean();
  }

  static async getWarehouses(filter: {
    search?: string;
    district?: string;
    status?: string;
  }): Promise<Warehouse[]> {
    const query: any = {};

    if (filter.search) {
      query.$or = [
        { district: { $regex: filter.search, $options: 'i' } },
        { city: { $regex: filter.search, $options: 'i' } },
        { region: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.district) query.district = filter.district;
    if (filter.status) query.status = filter.status;

    return WarehouseModel.find(query).lean() as unknown as Warehouse[];
  }

  // Merchant operations
  static async applyMerchant(merchantData: Omit<Merchant, '_id'>) {
    const existing = await MerchantModel.findOne({
      email: merchantData.email,
    }).lean();
    if (existing) {
      return {
        success: false,
        message: 'A merchant application already exists for this email.',
      };
    }

    const user = await UserModel.findOne({ email: merchantData.email }).lean();
    if (!user) {
      return { success: false, message: 'User not found in system.' };
    }

    const newMerchant = {
      ...merchantData,
      userId: user._id as ObjectId,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    const result = await MerchantModel.create(newMerchant);
    return {
      success: true,
      message: 'Application submitted successfully and is pending approval.',
      merchantId: (result as any)._id,
    };
  }

  static async getMerchantProfile(email: string): Promise<Merchant | null> {
    return MerchantModel.findOne({
      email,
    }).lean() as unknown as Merchant | null;
  }

  static async getMerchantStats(email: string) {
    const merchant = await this.getMerchantProfile(email);
    if (!merchant) {
      return null;
    }

    const stats = await ParcelModel.aggregate([
      { $match: { merchantId: merchant._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalCODCollected: {
            $sum: {
              $cond: [{ $eq: ['$delivery_status', 'delivered'] }, '$codAmount', 0],
            },
          },
          pendingCOD: {
            $sum: {
              $cond: [{ $ne: ['$delivery_status', 'delivered'] }, '$codAmount', 0],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ['$delivery_status', 'delivered'] }, 1, 0],
            },
          },
        },
      },
    ]);

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
  static async createLandingItem(name: string, item: any) {
    const MModel = modelMap[name];
    if (!MModel) throw new Error(`Model not found for: ${name}`);

    if (item.isActive === undefined) item.isActive = true;
    item.createdAt = new Date().toISOString();

    return MModel.create(item);
  }

  static async updateLandingItem(name: string, id: string, update: any) {
    const MModel = modelMap[name];
    if (!MModel) throw new Error(`Model not found for: ${name}`);

    return MModel.updateOne({ _id: new ObjectId(id) }, { $set: update });
  }

  static async deleteLandingItem(name: string, id: string) {
    const MModel = modelMap[name];
    if (!MModel) throw new Error(`Model not found for: ${name}`);

    return MModel.deleteOne({ _id: new ObjectId(id) });
  }
}
