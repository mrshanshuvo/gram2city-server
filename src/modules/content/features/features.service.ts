import { featuresCollection } from "../../../db/db";
import { FeatureItem } from "../content.interface";

export class FeaturesService {
  static async getFeatures(showAll?: boolean): Promise<FeatureItem[]> {
    const query = showAll ? {} : { isActive: true };
    return (await featuresCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as FeatureItem[];
  }
}
