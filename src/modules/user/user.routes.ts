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
  getMyAddresses,
  addAddress,
  deleteAddress,
} from "./user.controller";
import { verifyFBToken, verifyAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  registerUserSchema,
  updateProfileSchema,
} from "./user.schema";

const router = Router();

// User Profile & Authority Control
router.get("/users/search", verifyFBToken, verifyAdmin, searchUsers);
router.get("/users/staff", verifyFBToken, verifyAdmin, getStaffList);
router.get("/users/summary", verifyFBToken, verifyAdmin, getUsersSummary);
router.patch("/users/:email/role", verifyFBToken, verifyAdmin, updateUserRole);
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

// Address Book Operations
router.get("/addresses", verifyFBToken, getMyAddresses);
router.post("/addresses", verifyFBToken, addAddress);
router.delete("/addresses/:id", verifyFBToken, deleteAddress);

export default router;
