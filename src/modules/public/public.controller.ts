import { Request, Response } from "express";
import { PublicService } from "./public.service";
import { uploadToCloudinary } from "../../utils/upload";

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await PublicService.getPublicSettings();
    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getPublicTracking = async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const history = await PublicService.getPublicTracking(trackingId as string);
    res.send({ success: true, history });
  } catch (error) {
    res.status(500).send({ success: false, message: "Tracking failed" });
  }
};

export const getProcessSteps = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const steps = await PublicService.getProcessSteps(showAll);
    res.send({ success: true, data: steps });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getLandingConfig = async (req: Request, res: Response) => {
  try {
    const config = await PublicService.getLandingConfig();
    res.send({ success: true, data: config });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const updateLandingConfig = async (req: Request, res: Response) => {
  try {
    const update = req.body;
    delete update._id;

    // If an OG image file was uploaded, push it to Cloudinary and store the URL
    if (req.file) {
      update.seo = update.seo || {};
      update.seo.image = await uploadToCloudinary(req.file, "gram2city/config");
    }

    await PublicService.updateLandingConfig(update);
    res.send({ success: true, message: "Configuration updated" });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update config" });
  }
};

export const getBanners = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const banners = await PublicService.getBanners(showAll);
    res.send({ success: true, data: banners });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const services = await PublicService.getServices(showAll);
    res.send({ success: true, data: services });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getFeatures = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const features = await PublicService.getFeatures(showAll);
    res.send({ success: true, data: features });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getPartners = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const partners = await PublicService.getPartners(showAll);
    res.send({ success: true, data: partners });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === "true";
    const testimonials = await PublicService.getTestimonials(showAll);
    res.send({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await PublicService.getStats();
    res.send({ success: true, data: stats });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error fetching stats" });
  }
};

export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid email address" });
    }

    const result = await PublicService.subscribeNewsletter(email);
    if (!result.success) {
      return res.status(400).send(result);
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Subscription failed" });
  }
};

export const getNewsletterSubscribers = async (
  _req: Request,
  res: Response,
) => {
  try {
    const subscribers = await PublicService.getNewsletterSubscribers();
    res.send({ success: true, data: subscribers });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch subscribers" });
  }
};

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const { search, district, status } = req.query;
    const data = await PublicService.getWarehouses({
      search: search as string,
      district: district as string,
      status: status as string,
    });
    res.send({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Error fetching warehouses" });
  }
};

// Merchant controllers
export const applyMerchant = async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      businessType,
      tradeLicense,
      address,
      district,
      phone,
      contactNumber,
      shopAddress,
    } = req.body;
    const email = req.user?.email as string;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "User email not found in token." });
    }

    const result = await PublicService.applyMerchant({
      userId: undefined as any,
      email,
      businessName,
      businessType,
      tradeLicense: tradeLicense || "Pending",
      address: address || shopAddress || "",
      district: district || "Dhaka",
      phone: phone || contactNumber || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    if (!result.success) {
      return res.status(400).send(result);
    }

    res.status(201).send(result);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to submit application." });
  }
};

export const getMerchantProfile = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email as string;
    const merchant = await PublicService.getMerchantProfile(email);
    if (!merchant) {
      return res
        .status(404)
        .send({ success: false, message: "Merchant profile not found." });
    }
    res.send({ success: true, data: merchant });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch merchant profile." });
  }
};

export const getMerchantStats = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email as string;
    const stats = await PublicService.getMerchantStats(email);
    if (!stats) {
      return res
        .status(404)
        .send({ success: false, message: "Merchant not found" });
    }
    res.send({ success: true, stats });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch merchant stats" });
  }
};

// Generic Landing Item Operations
const getModuleNameAndField = (path: string) => {
  // path could be e.g. "/landing/banners" or "/landing/partners/60d..."
  const cleanPath = path.replace(/^\//, "");
  const parts = cleanPath.split("/");
  // If the route is prefixed with "landing", the module name is the second part
  const moduleName = parts[0] === "landing" ? parts[1] : parts[0];
  const imageField =
    moduleName === "process-steps"
      ? undefined
      : moduleName === "partners"
        ? "logo"
        : "image";
  return { moduleName, imageField };
};

export const createLandingItem = async (req: Request, res: Response) => {
  try {
    const { moduleName, imageField } = getModuleNameAndField(req.path);
    const item = req.body;

    if (imageField && req.file) {
      const folder = `gram2city/${moduleName}`;
      item[imageField] = await uploadToCloudinary(req.file, folder);
    }

    const result = await PublicService.createLandingItem(moduleName, item);
    res.send({ success: true, data: { ...item, _id: result.insertedId } });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to create item",
    });
  }
};

export const updateLandingItem = async (req: Request, res: Response) => {
  try {
    const { moduleName, imageField } = getModuleNameAndField(req.path);
    const { id } = req.params;
    const update = req.body;
    delete update._id;

    if (imageField && req.file) {
      const folder = `gram2city/${moduleName}`;
      update[imageField] = await uploadToCloudinary(req.file, folder);
    }

    const result = await PublicService.updateLandingItem(
      moduleName,
      id as string,
      update,
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Item updated" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update item",
    });
  }
};

export const deleteLandingItem = async (req: Request, res: Response) => {
  try {
    const { moduleName } = getModuleNameAndField(req.path);
    const { id } = req.params;
    const result = await PublicService.deleteLandingItem(
      moduleName,
      id as string,
    );
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    res.send({ success: true, message: "Item deleted" });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete item",
    });
  }
};
