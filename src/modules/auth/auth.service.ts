import axios from 'axios';
import admin from 'firebase-admin';
import { UserModel } from '../../db/models';
import type { User } from '../../types/types';
import { FirebaseAuthResponse } from './auth.interface';
import { uploadToCloudinary } from '../../utils/upload';
import { config } from '../../config';

const API_KEY = config.FB_WEB_API_KEY;

export class AuthService {
  static async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    return uploadToCloudinary(file, 'gram2city/avatars');
  }

  static async registerFirebaseUser(
    email: string,
    password: string,
  ): Promise<FirebaseAuthResponse> {
    const fbRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      { email, password, returnSecureToken: true },
    );
    return {
      idToken: fbRes.data.idToken,
      expiresIn: fbRes.data.expiresIn,
    };
  }

  static async createUserRecord(newUser: User): Promise<void> {
    await UserModel.create(newUser);
  }

  static async loginFirebaseUser(email: string, password: string): Promise<FirebaseAuthResponse> {
    const fbRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      { email, password, returnSecureToken: true },
    );
    return {
      idToken: fbRes.data.idToken,
      expiresIn: fbRes.data.expiresIn,
    };
  }

  static async getUserRecordByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email }).lean() as unknown as User | null;
  }

  static async getFirebaseUserByEmail(email: string) {
    return admin.auth().getUserByEmail(email);
  }

  static async updateLastLogin(email: string): Promise<string> {
    const lastLogin = new Date().toISOString();
    await UserModel.updateOne({ email }, { $set: { last_login: lastLogin } });
    return lastLogin;
  }

  static async sendFirebaseVerification(idToken: string): Promise<void> {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      { requestType: 'VERIFY_EMAIL', idToken },
    );
  }

  static async deleteFirebaseUser(uid: string): Promise<void> {
    await admin.auth().deleteUser(uid);
  }

  static async deleteUserRecord(email: string): Promise<void> {
    await UserModel.deleteOne({ email });
  }

  static async sendFirebasePasswordReset(email: string): Promise<void> {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      { requestType: 'PASSWORD_RESET', email },
    );
  }

  static async createFirebaseUserAdmin(email: string, password: string, name: string) {
    return admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
  }

  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }
}
