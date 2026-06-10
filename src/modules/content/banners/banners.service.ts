import { bannersCollection } from "../../../db/db";
import { BannerSlide } from "../content.interface";

export class BannersService {
  static async getBanners(showAll?: boolean): Promise<BannerSlide[]> {
    const query = showAll ? {} : { isActive: true };
    return (await bannersCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as BannerSlide[];
  }
}
