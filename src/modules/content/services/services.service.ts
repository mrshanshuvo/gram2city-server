import { servicesCollection } from "../../../db/db";
import { ServiceItem } from "../content.interface";

export class ServicesService {
  static async getServices(showAll?: boolean): Promise<ServiceItem[]> {
    const query = showAll ? {} : { isActive: true };
    return (await servicesCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as ServiceItem[];
  }
}
