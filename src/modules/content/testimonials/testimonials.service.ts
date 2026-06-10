import { testimonialsCollection } from "../../../db/db";

export class TestimonialsService {
  static async getTestimonials(showAll?: boolean): Promise<any[]> {
    const query = showAll ? {} : { isActive: true };
    return testimonialsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }
}
