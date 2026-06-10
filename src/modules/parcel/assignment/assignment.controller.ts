import { Request, Response } from "express";
import { AssignmentService } from "./assignment.service";

export const assignRider = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { riderId } = req.body;
  try {
    const result = await AssignmentService.assignRiderToParcel(
      id as string,
      riderId,
      req.user?.email as string,
    );
    if (!result.success) {
      return res.status(400).send(result);
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to assign rider" });
  }
};
