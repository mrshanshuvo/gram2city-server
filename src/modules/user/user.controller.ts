import { Request, Response } from "express";
import { UserService } from "./user.service";
import { User, Avatar } from "./user.interface";

// ─── USER CONTROLLERS ────────────────────────────────────────────────────────

export const searchUsers = async (req: Request, res: Response) => {
  const emailQuery = req.query.email as string | undefined;
  if (!emailQuery)
    return res.status(400).send({ error: "Email query is required" });
  try {
    const users = await UserService.searchUsers(emailQuery);
    res.send(users);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getStaffList = async (req: Request, res: Response) => {
  try {
    const staff = await UserService.getStaffList();
    res.send(staff);
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getUsersSummary = async (req: Request, res: Response) => {
  try {
    const summary = await UserService.getUsersSummary();
    res.send({
      success: true,
      ...summary,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch summary" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { email } = req.params;
  const { role } = req.body || {};
  try {
    const result = await UserService.updateUserRole(email as string, role);
    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch {
    res.status(500).send({ success: false, error: "Failed to update role" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const { email } = req.params;
  const { name, photoURL, phone, address } = req.body || {};
  if (req.user?.email !== email)
    return res.status(403).send({ success: false, message: "Unauthorized" });
  try {
    const isComplete = !!(name && phone && address);

    const result = await UserService.updateUserProfile(email as string, {
      name,
      photoURL,
      phone,
      address,
      isProfileComplete: isComplete,
    });
    res.send({
      success: true,
      modifiedCount: result.modifiedCount,
      isProfileComplete: isComplete,
    });
  } catch {
    res.status(500).send({ success: false, error: "Failed to update profile" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const email = req.user?.email;
  if (!email) {
    return res
      .status(400)
      .send({ success: false, message: "Email not found in token" });
  }

  const existingUser = await UserService.getUserByEmail(email);
  if (existingUser) {
    return res.status(200).send({
      success: true,
      message: "User already exists",
      existing: true,
    });
  }

  const name = req.body?.name || req.user?.name;
  const photoURL = req.body?.photoURL || req.user?.picture;

  const newUser: User = {
    email,
    name,
    photoURL,
    role: "user",
    isProfileComplete: false,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  try {
    const result = await UserService.createUserRecord(newUser);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const syncUser = async (req: Request, res: Response) => {
  const email = req.user?.email;
  if (!email)
    return res.status(401).send({ success: false, message: "Unauthorized" });

  const name = req.body?.name || req.user?.name;
  const photoURL = req.body?.photoURL || req.user?.picture;

  const updateDoc: any = {
    $setOnInsert: {
      email,
      role: "user",
      created_at: new Date().toISOString(),
    },
    $set: {
      last_login: new Date().toISOString(),
    },
  };

  if (name) {
    updateDoc.$set.name = name;
  }
  if (photoURL) {
    updateDoc.$set.photoURL = photoURL;
  }

  try {
    await UserService.syncUser(email, updateDoc);
    const user = await UserService.getUserByEmail(email);
    res.send({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const stats = await UserService.getUserStats(email as string);
    res.send(stats);
  } catch {
    res.status(500).send({ error: "Failed to fetch user stats" });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const user = await UserService.getUserByEmail(email as string);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }
    res.send(user);
  } catch {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

// ─── AVATAR CONTROLLERS ──────────────────────────────────────────────────────

export const getRandomAvatar = async (req: Request, res: Response) => {
  try {
    const avatar = await UserService.getRandomAvatar();
    res.json(avatar);
  } catch (error) {
    res.status(500).json({ message: "Error fetching random avatar" });
  }
};

export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const avatars = await UserService.getAllAvatars();
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ message: "Error fetching avatars" });
  }
};

export const addAvatar = async (req: Request, res: Response) => {
  try {
    const { url, name, category } = req.body;
    if (!url) return res.status(400).json({ message: "URL is required" });

    const newAvatar = {
      url,
      name: name || "Default Avatar",
      category: category || "General",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const result = await UserService.addAvatar(newAvatar);
    res.status(201).json({ ...newAvatar, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Error adding avatar" });
  }
};

export const magicGenerateAvatars = async (req: Request, res: Response) => {
  try {
    const { style, count } = req.body;
    const selectedStyle = style || "lorelei";
    const selectedCount = count || 10;

    const newAvatars = Array.from({ length: selectedCount }).map((_, i) => ({
      url: `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${Math.random().toString(36).substring(7)}`,
      name: `Magic ${selectedStyle} ${i + 1}`,
      category: "AI Generated",
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    const result = await UserService.magicGenerateAvatars(newAvatars);
    res.status(201).json({ count: result.insertedCount });
  } catch (error) {
    res.status(500).json({ message: "Error generating avatars" });
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await UserService.deleteAvatar(id as string);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Avatar not found" });
    }
    res.json({ message: "Avatar deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting avatar" });
  }
};


export const updateUserStatus = async (req: Request, res: Response) => {
  const email = req.params.email as string;
  const { status } = req.body;
  try {
    await UserService.updateUserStatus(
      email,
      status,
      req.user?.email as string,
    );
    res.send({
      success: true,
      message: `User account ${status} successfully.`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update user status" });
  }
};

export const getMerchants = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const merchants = await UserService.getMerchants(status as string);
    res.send({ success: true, data: merchants });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch merchants" });
  }
};

export const updateMerchantStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await UserService.updateMerchantStatus(
      id as string,
      status,
      req.user?.email as string,
    );
    if (!result.success) {
      return res.status(404).send(result);
    }
    res.send(result);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to update status" });
  }
};

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

    const result = await UserService.applyMerchant({
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
    const merchant = await UserService.getMerchantProfile(email);
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
    const stats = await UserService.getMerchantStats(email);
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

