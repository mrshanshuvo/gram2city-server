import {
  settingsCollection,
  landingConfigCollection,
  warehousesCollection,
  ridersCollection,
} from "../../../db/db";
import { ContentConfig, Warehouse } from "../content.interface";

export class SettingsService {
  static async getPublicSettings() {
    return settingsCollection.findOne({});
  }

  static async getContentConfig(): Promise<ContentConfig | null> {
    return landingConfigCollection.findOne(
      {},
    ) as unknown as ContentConfig | null;
  }

  static async updateContentConfig(
    update: Partial<ContentConfig>,
  ): Promise<void> {
    await landingConfigCollection.updateOne(
      {},
      { $set: update },
      { upsert: true },
    );
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
}
