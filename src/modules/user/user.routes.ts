import { Router } from "express";
import {
  searchUsers,
  getStaffList,
  getUsersSummary,
  updateUserRole,
  updateUserProfile,
  registerUser,
  syncUser,
  getUserStats,
  getUserByEmail,
  getRandomAvatar,
  getAllAvatars,
  addAvatar,
  magicGenerateAvatars,
  deleteAvatar,
  updateUserStatus,
  getMerchants,
  updateMerchantStatus,
  applyMerchant,
  getMerchantProfile,
  getMerchantStats,
} from "./user.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  registerUserSchema,
  updateProfileSchema,
  userStatusSchema,
} from "./user.schema";

const router = Router();

// User Profile & Authority Control
router.get("/users/search", verifyFBToken, verifyAdmin, searchUsers);
router.get("/users/staff", verifyFBToken, verifyAdmin, getStaffList);
router.get("/users/summary", verifyFBToken, verifyAdmin, getUsersSummary);
router.patch("/users/:email/role", verifyFBToken, verifyAdmin, updateUserRole);
router.patch(
  "/users/:email/status",
  verifyFBToken,
  verifyAdmin,
  validate(userStatusSchema),
  updateUserStatus,
);
router.patch(
  "/users/:email",
  verifyFBToken,
  validate(updateProfileSchema),
  updateUserProfile,
);
router.post(
  "/users",
  verifyFBToken,
  validate(registerUserSchema),
  registerUser,
);
router.post("/users/sync", verifyFBToken, syncUser);
router.get("/user/stats/:email", verifyFBToken, getUserStats);
router.get("/users/:email", verifyFBToken, getUserByEmail);

// Admin Merchant Routes
router.get("/merchants", verifyFBToken, verifyAdmin, getMerchants);
router.patch("/merchants/:id/status", verifyFBToken, verifyAdmin, updateMerchantStatus);
router.post("/merchants", verifyFBToken, applyMerchant);
router.get("/merchants/me", verifyFBToken, getMerchantProfile);
router.get("/merchants/stats", verifyFBToken, getMerchantStats);

// Avatar Library Operations
router.get("/avatars/random", getRandomAvatar);
router.get("/avatars", getAllAvatars);
router.post("/avatars", verifyFBToken, verifyAdmin, addAvatar);
router.post(
  "/avatars/magic-generate",
  verifyFBToken,
  verifyAdmin,
  magicGenerateAvatars,
);
router.delete("/avatars/:id", verifyFBToken, verifyAdmin, deleteAvatar);

export default router;
