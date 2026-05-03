import { Router } from "express";
import axios from "axios";
import admin from "firebase-admin";
import multer from "multer";
import FormData from "form-data";
import { usersCollection } from "../db";
import { User } from "../types";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const API_KEY = process.env.FB_WEB_API_KEY;
const IMGBB_KEY = process.env.IMGBB_API_KEY;

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with Image Upload (Firebase + MongoDB)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Registration failed
 */
router.post("/auth/register", upload.single("image"), async (req, res) => {
  const { email, password, name } = req.body;
  let photoURL = "";

  try {
    // 1. Image Upload Phase
    if (req.file) {
      try {
        const formData = new FormData();
        formData.append("image", req.file.buffer.toString("base64"));
        const imgRes = await axios.post(
          `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
          formData,
          { headers: formData.getHeaders() }
        );
        photoURL = imgRes.data.data.display_url;
      } catch (imgError) {
        console.error("ImgBB Upload Error:", imgError);
        return res.status(400).send({
          success: false,
          message: "Failed to upload profile image. Please try a different file.",
        });
      }
    }

    // 2. Firebase Registration Phase
    let idToken = "";
    let expiresIn = "";
    try {
      const fbRes = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        { email, password, returnSecureToken: true }
      );
      idToken = fbRes.data.idToken;
      expiresIn = fbRes.data.expiresIn;
    } catch (fbError: any) {
      const fbErrMsg = fbError.response?.data?.error?.message || "";
      console.error("Firebase Registration Error Raw:", fbErrMsg);
      
      let message = "Authentication failed.";

      if (fbErrMsg.includes("EMAIL_EXISTS")) message = "This email is already registered.";
      else if (fbErrMsg.includes("INVALID_EMAIL")) message = "Please provide a valid email address.";
      else if (fbErrMsg.includes("WEAK_PASSWORD")) message = "Password should be at least 6 characters.";
      else if (fbErrMsg.includes("TOO_MANY_ATTEMPTS")) message = "Too many attempts. Please try again later.";

      return res.status(400).send({ success: false, message });
    }

    // 3. Database Save Phase
    try {
      const newUser: User = {
        email,
        name,
        photoURL,
        role: "user",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      await usersCollection.insertOne(newUser);
      res.status(201).send({ 
        success: true, 
        message: "Registration successful! Welcome to Gram2City.",
        token: idToken, 
        role: newUser.role,
        expiresIn 
      });
    } catch (dbError) {
      console.error("MongoDB Save Error:", dbError);
      res.status(500).send({
        success: false,
        message: "Account created in Firebase, but failed to save profile to database.",
      });
    }
  } catch (error: any) {
    console.error("Unexpected Register Error:", error);
    res.status(500).send({ success: false, message: "An unexpected error occurred during registration." });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get Firebase ID Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Login to Firebase
    const fbRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      { email, password, returnSecureToken: true }
    );

    const { idToken, expiresIn } = fbRes.data;

    // 2. Fetch User from MongoDB
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Authenticated in Firebase, but user record not found in database.",
      });
    }

    // 3. Fetch detailed user info from Firebase to get emailVerified status
    const fbUser = await admin.auth().getUserByEmail(email);

    // 4. Update last login in MongoDB
    const lastLogin = new Date().toISOString();
    await usersCollection.updateOne(
      { email },
      { $set: { last_login: lastLogin } }
    );

    res.send({ 
      success: true, 
      message: "Login successful",
      token: idToken, 
      role: user.role, 
      lastLogin,
      expiresIn,
      emailVerified: fbUser.emailVerified
    });
  } catch (error: any) {
    const fbErrMsg = error.response?.data?.error?.message || "";
    let message = "Login failed.";

    if (fbErrMsg.includes("EMAIL_NOT_FOUND") || fbErrMsg.includes("INVALID_PASSWORD")) {
      message = "Invalid email or password.";
    } else if (fbErrMsg.includes("USER_DISABLED")) {
      message = "This account has been disabled.";
    }

    res.status(401).send({ success: false, message });
  }
});

import { verifyFBToken } from "../middleware/auth";

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get currently logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/auth/me", verifyFBToken, async (req, res) => {
  try {
    const email = req.user?.email;
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    res.send({ 
      success: true, 
      user: {
        ...user,
        emailVerified: req.user?.email_verified || false
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send email verification link
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post("/auth/send-verification", verifyFBToken, async (req, res) => {
  try {
    const idToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      { requestType: "VERIFY_EMAIL", idToken }
    );
    
    res.send({ success: true, message: "Verification email sent. Please check your inbox." });
  } catch (error: any) {
    res.status(400).send({ 
      success: false, 
      message: error.response?.data?.error?.message || "Failed to send verification email." 
    });
  }
});

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Delete own account (GDPR)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete("/auth/me", verifyFBToken, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;

    // 1. Delete from Firebase
    await admin.auth().deleteUser(uid);

    // 2. Delete from MongoDB
    await usersCollection.deleteOne({ email });

    res.send({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send({ success: false, message: "Failed to delete account." });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "string" }
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post("/auth/reset-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ success: false, message: "Email is required." });

  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      { requestType: "PASSWORD_RESET", email }
    );
    res.send({ success: true, message: "A password reset link has been sent to your email." });
  } catch (error: any) {
    const fbErrMsg = error.response?.data?.error?.message || "";
    let message = "Failed to send reset email.";

    if (fbErrMsg.includes("EMAIL_NOT_FOUND")) message = "No account found with this email address.";
    else if (fbErrMsg.includes("INVALID_EMAIL")) message = "Please enter a valid email address.";

    res.status(400).send({ success: false, message });
  }
});

import { verifyAdmin } from "../middleware/auth";

/**
 * @swagger
 * /auth/admin/create-user:
 *   post:
 *     summary: Admin only - Onboard a new user/rider
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email: { type: string, example: "string" }
 *               password: { type: string, example: "string" }
 *               name: { type: string, example: "string" }
 *               role: { type: string, enum: [admin, rider, user] }
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/auth/admin/create-user", verifyFBToken, verifyAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).send({ success: false, message: "All fields (email, password, name, role) are required." });
  }

  try {
    // 1. Create in Firebase
    const fbUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Save to MongoDB
    const newUser: User = {
      email,
      name,
      photoURL: "",
      role: role as any,
      created_at: new Date().toISOString(),
      last_login: "",
    };
    await usersCollection.insertOne(newUser);

    res.status(201).send({ 
      success: true, 
      message: `Successfully onboarded new ${role}: ${name}`, 
      uid: fbUser.uid 
    });
  } catch (error: any) {
    let message = "Failed to create user.";
    
    if (error.code === "auth/email-already-exists") message = "This email is already registered.";
    else if (error.code === "auth/invalid-password") message = "Password must be at least 6 characters.";
    else if (error.code === "auth/invalid-email") message = "The email address is badly formatted.";

    res.status(400).send({ success: false, message });
  }
});

export default router;
