import { Router } from "express";
import multer from "multer";
import {
  getChatHistory,
  getUserConversations,
  uploadChatImage,
} from "./chat.controller";
import { verifyFBToken } from "../../middleware/auth";

const router = Router();

// Multer for chat image uploads
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

router.get("/messages/conversations", verifyFBToken, getUserConversations);
router.get("/messages/:conversationId", verifyFBToken, getChatHistory);
router.post(
  "/messages/upload-image",
  verifyFBToken,
  chatUpload.single("image"),
  uploadChatImage,
);

export default router;
