import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { User } from '../../types/types';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  let photoURL = '';

  try {
    const existingUser = await AuthService.getUserRecordByEmail(email);
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: 'This email is already registered.',
      });
    }

    if (req.file) {
      try {
        photoURL = await AuthService.uploadProfileImage(req.file);
      } catch (imgError) {
        console.error('Profile image upload error:', imgError);
      }
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      photoURL: photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${email}`,
      role: 'user',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    await AuthService.createUserRecord(newUser);

    const { generateJWT } = await import('../../utils/jwt');
    const token = generateJWT({ email: newUser.email, role: 'user' });

    res.status(201).send({
      success: true,
      message: 'Registration successful! Welcome to Gram2City.',
      token,
      role: newUser.role,
      user: {
        email: newUser.email,
        name: newUser.name,
        photoURL: newUser.photoURL,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Unexpected Register Error:', error);
    res.status(500).send({
      success: false,
      message: 'An unexpected error occurred during registration.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await AuthService.getUserRecordByEmail(email);

    if (!user) {
      // Fallback: Check if Firebase user exists
      try {
        const fbLogin = await AuthService.loginFirebaseUser(email, password);
        const { idToken, expiresIn } = fbLogin;
        return res.send({
          success: true,
          message: 'Login successful',
          token: idToken,
          role: 'user',
          expiresIn,
        });
      } catch {
        return res.status(401).send({
          success: false,
          message: 'Invalid email or password.',
        });
      }
    }

    if (user.password) {
      const isMatch = await AuthService.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).send({
          success: false,
          message: 'Invalid email or password.',
        });
      }
    }

    const { generateJWT } = await import('../../utils/jwt');
    const token = generateJWT({ email: user.email, role: user.role || 'user' });
    const lastLogin = await AuthService.updateLastLogin(email);

    res.send({
      success: true,
      message: 'Login successful',
      token,
      role: user.role || 'user',
      lastLogin,
      user: {
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(401).send({ success: false, message: 'Login failed.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const user = await AuthService.getUserRecordByEmail(email);

    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    res.send({
      success: true,
      user: {
        ...user,
        emailVerified: req.user?.email_verified || false,
      },
    });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Server error' });
  }
};

export const sendVerification = async (req: Request, res: Response) => {
  try {
    const idToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!idToken) {
      return res.status(400).send({ success: false, message: 'Token is required.' });
    }

    await AuthService.sendFirebaseVerification(idToken);

    res.send({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to send verification email.',
    });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;
    if (!uid || !email) {
      return res.status(401).send({ success: false, message: 'Unauthorized' });
    }

    // 1. Delete from Firebase
    await AuthService.deleteFirebaseUser(uid);

    // 2. Delete from MongoDB
    await AuthService.deleteUserRecord(email);

    res.send({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).send({ success: false, message: 'Failed to delete account.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ success: false, message: 'Email is required.' });

  try {
    await AuthService.sendFirebasePasswordReset(email);
    res.send({
      success: true,
      message: 'A password reset link has been sent to your email.',
    });
  } catch (error: any) {
    const fbErrMsg = error.response?.data?.error?.message || '';
    let message = 'Failed to send reset email.';

    if (fbErrMsg.includes('EMAIL_NOT_FOUND')) message = 'No account found with this email address.';
    else if (fbErrMsg.includes('INVALID_EMAIL')) message = 'Please enter a valid email address.';

    res.status(400).send({ success: false, message });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).send({
      success: false,
      message: 'All fields (email, password, name, role) are required.',
    });
  }

  try {
    // 1. Create in Firebase
    const fbUser = await AuthService.createFirebaseUserAdmin(email, password, name);

    // 2. Save to MongoDB
    const newUser: User = {
      email,
      name,
      photoURL: '',
      role: role as any,
      created_at: new Date().toISOString(),
      last_login: '',
    };
    await AuthService.createUserRecord(newUser);

    res.status(201).send({
      success: true,
      message: `Successfully onboarded new ${role}: ${name}`,
      uid: fbUser.uid,
    });
  } catch (error: any) {
    let message = 'Failed to create user.';

    if (error.code === 'auth/email-already-exists') message = 'This email is already registered.';
    else if (error.code === 'auth/invalid-password')
      message = 'Password must be at least 6 characters.';
    else if (error.code === 'auth/invalid-email') message = 'The email address is badly formatted.';

    res.status(400).send({ success: false, message });
  }
};
