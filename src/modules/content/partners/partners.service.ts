import { partnersCollection } from "../../../db/db";
import { PartnerLogo } from "../content.interface";

export class PartnersService {
  static async getPartners(showAll?: boolean): Promise<PartnerLogo[]> {
    const query = showAll ? {} : { isActive: true };
    return (await partnersCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as PartnerLogo[];
  }
}
