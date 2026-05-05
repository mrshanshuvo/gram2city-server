import express from "express";
import { avatarsCollection } from "../db";
import { ObjectId } from "mongodb";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";

const router = express.Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

/**
 * @route GET /api/avatars/random
 * @desc Get a random active avatar for registration
 */
router.get("/random", async (req, res) => {
  try {
    const avatars = await avatarsCollection.find({ isActive: true }).toArray();
    if (avatars.length === 0) {
      // Fallback if no avatars in DB
      return res.json({ 
        url: "https://api.dicebear.com/7.x/lorelei/svg?seed=" + Math.random().toString(36).substring(7) 
      });
    }
    const randomIndex = Math.floor(Math.random() * avatars.length);
    res.json(avatars[randomIndex]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching random avatar" });
  }
});

/**
 * @route GET /api/avatars
 * @desc Get all active avatars
 */
router.get("/", async (req, res) => {
  try {
    const avatars = await avatarsCollection.find({ isActive: true }).toArray();
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ message: "Error fetching avatars" });
  }
});

// ─── ADMIN ROUTES (Protected) ──────────────────────────────────────────────

router.use(verifyFBToken, verifyAdmin);

/**
 * @route POST /api/avatars
 * @desc Add a new avatar to the library
 */
router.post("/", async (req, res) => {
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

    const result = await avatarsCollection.insertOne(newAvatar);
    res.status(201).json({ ...newAvatar, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Error adding avatar" });
  }
});

/**
 * @route POST /api/avatars/magic-generate
 * @desc Auto-generate a set of avatars using DiceBear
 */
router.post("/magic-generate", async (req, res) => {
  try {
    const { style, count } = req.body; // e.g. "lorelei", 10
    const selectedStyle = style || "lorelei";
    const selectedCount = count || 10;

    const newAvatars = Array.from({ length: selectedCount }).map((_, i) => ({
      url: `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${Math.random().toString(36).substring(7)}`,
      name: `Magic ${selectedStyle} ${i + 1}`,
      category: "AI Generated",
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    const result = await avatarsCollection.insertMany(newAvatars);
    res.status(201).json({ count: result.insertedCount });
  } catch (error) {
    res.status(500).json({ message: "Error generating avatars" });
  }
});

/**
 * @route DELETE /api/avatars/:id
 * @desc Delete an avatar
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await avatarsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Avatar not found" });
    }
    res.json({ message: "Avatar deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting avatar" });
  }
});

export default router;
