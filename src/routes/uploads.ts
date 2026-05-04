import { Router } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { verifyFBToken } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an image to ImgBB
 *     tags: [Uploads]
 *     security:
 *       - firebaseAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 */
router.post(
  "/upload",
  verifyFBToken,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .send({ success: false, message: "No file uploaded" });
    }

    try {
      const formData = new FormData();
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      res.send({ success: true, url: response.data.data.url });
    } catch (error: any) {
      console.error(
        "ImgBB upload error:",
        error.response?.data || error.message,
      );
      res
        .status(500)
        .send({ success: false, message: "Failed to upload image to ImgBB" });
    }
  },
);

export default router;
