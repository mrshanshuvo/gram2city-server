import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { User } from "../../types";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  let photoURL = "";

  try {
    // 1. Image Upload Phase
    if (req.file) {
      try {
        photoURL = await AuthService.uploadProfileImage(req.file.buffer);
      } catch (imgError) {
        console.error("ImgBB Upload Error:", imgError);
        return res.status(400).send({
          success: false,
          message:
            "Failed to upload profile image. Please try a different file.",
        });
      }
    }

    // 2. Firebase Registration Phase
    let idToken = "";
    let expiresIn = "";
    try {
      const fbReg = await AuthService.registerFirebaseUser(email, password);
      idToken = fbReg.idToken;
      expiresIn = fbReg.expiresIn;
    } catch (fbError: any) {
      const fbErrMsg = fbError.response?.data?.error?.message || "";
      console.error("Firebase Registration Error Raw:", fbErrMsg);

      let message = "Authentication failed.";

      if (fbErrMsg.includes("EMAIL_EXISTS"))
        message = "This email is already registered.";
      else if (fbErrMsg.includes("INVALID_EMAIL"))
        message = "Please provide a valid email address.";
      else if (fbErrMsg.includes("WEAK_PASSWORD"))
        message = "Password should be at least 6 characters.";
      else if (fbErrMsg.includes("TOO_MANY_ATTEMPTS"))
        message = "Too many attempts. Please try again later.";

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
      await AuthService.createUserRecord(newUser);
      res.status(201).send({
        success: true,
        message: "Registration successful! Welcome to Gram2City.",
        token: idToken,
        role: newUser.role,
        expiresIn,
      });
    } catch (dbError) {
      console.error("MongoDB Save Error:", dbError);
      res.status(500).send({
        success: false,
        message:
          "Account created in Firebase, but failed to save profile to database.",
      });
    }
  } catch (error: any) {
    console.error("Unexpected Register Error:", error);
    res.status(500).send({
      success: false,
      message: "An unexpected error occurred during registration.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Login to Firebase
    const fbLogin = await AuthService.loginFirebaseUser(email, password);
    const { idToken, expiresIn } = fbLogin;

    // 2. Fetch User from MongoDB
    const user = await AuthService.getUserRecordByEmail(email);

    if (!user) {
      return res.status(404).send({
        success: false,
        message:
          "Authenticated in Firebase, but user record not found in database.",
      });
    }

    // 3. Fetch detailed user info from Firebase to get emailVerified status
    const fbUser = await AuthService.getFirebaseUserByEmail(email);

    // 4. Update last login in MongoDB
    const lastLogin = await AuthService.updateLastLogin(email);

    res.send({
      success: true,
      message: "Login successful",
      token: idToken,
      role: user.role,
      lastLogin,
      expiresIn,
      emailVerified: fbUser.emailVerified,
    });
  } catch (error: any) {
    const fbErrMsg = error.response?.data?.error?.message || "";
    let message = "Login failed.";

    if (
      fbErrMsg.includes("EMAIL_NOT_FOUND") ||
      fbErrMsg.includes("INVALID_PASSWORD")
    ) {
      message = "Invalid email or password.";
    } else if (fbErrMsg.includes("USER_DISABLED")) {
      message = "This account has been disabled.";
    }

    res.status(401).send({ success: false, message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    const user = await AuthService.getUserRecordByEmail(email);

    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    res.send({
      success: true,
      user: {
        ...user,
        emailVerified: req.user?.email_verified || false,
      },
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

export const sendVerification = async (req: Request, res: Response) => {
  try {
    const idToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!idToken) {
      return res
        .status(400)
        .send({ success: false, message: "Token is required." });
    }

    await AuthService.sendFirebaseVerification(idToken);

    res.send({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message:
        error.response?.data?.error?.message ||
        "Failed to send verification email.",
    });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;
    if (!uid || !email) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }

    // 1. Delete from Firebase
    await AuthService.deleteFirebaseUser(uid);

    // 2. Delete from MongoDB
    await AuthService.deleteUserRecord(email);

    res.send({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .send({ success: false, message: "Failed to delete account." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .send({ success: false, message: "Email is required." });

  try {
    await AuthService.sendFirebasePasswordReset(email);
    res.send({
      success: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (error: any) {
    const fbErrMsg = error.response?.data?.error?.message || "";
    let message = "Failed to send reset email.";

    if (fbErrMsg.includes("EMAIL_NOT_FOUND"))
      message = "No account found with this email address.";
    else if (fbErrMsg.includes("INVALID_EMAIL"))
      message = "Please enter a valid email address.";

    res.status(400).send({ success: false, message });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).send({
      success: false,
      message: "All fields (email, password, name, role) are required.",
    });
  }

  try {
    // 1. Create in Firebase
    const fbUser = await AuthService.createFirebaseUserAdmin(
      email,
      password,
      name,
    );

    // 2. Save to MongoDB
    const newUser: User = {
      email,
      name,
      photoURL: "",
      role: role as any,
      created_at: new Date().toISOString(),
      last_login: "",
    };
    await AuthService.createUserRecord(newUser);

    res.status(201).send({
      success: true,
      message: `Successfully onboarded new ${role}: ${name}`,
      uid: fbUser.uid,
    });
  } catch (error: any) {
    let message = "Failed to create user.";

    if (error.code === "auth/email-already-exists")
      message = "This email is already registered.";
    else if (error.code === "auth/invalid-password")
      message = "Password must be at least 6 characters.";
    else if (error.code === "auth/invalid-email")
      message = "The email address is badly formatted.";

    res.status(400).send({ success: false, message });
  }
};
