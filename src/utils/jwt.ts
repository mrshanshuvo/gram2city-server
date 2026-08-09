import jwt from 'jsonwebtoken';
import { config } from '../config';

const JWT_SECRET = process.env.JWT_SECRET || 'gram2city_jwt_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  email: string;
  role: string;
  uid?: string;
}

export const generateJWT = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
