import { processStepsCollection } from "../../../db/db";
import { ProcessStep } from "../content.interface";

export class ProcessStepsService {
  static async getProcessSteps(showAll?: boolean): Promise<ProcessStep[]> {
    const query = showAll ? {} : { isActive: true };
    return (await processStepsCollection
      .find(query)
      .sort({ order: 1 })
      .toArray()) as unknown as ProcessStep[];
  }
}
