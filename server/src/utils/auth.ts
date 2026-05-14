import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email:  string;
  name:   string;
}

const ACCESS_SECRET  = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const signAccessToken  = (p: JWTPayload) => jwt.sign(p, ACCESS_SECRET,  { expiresIn: '15m' });
export const signRefreshToken = (p: JWTPayload) => jwt.sign(p, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken  = (t: string) => jwt.verify(t, ACCESS_SECRET)  as JWTPayload;
export const verifyRefreshToken = (t: string) => jwt.verify(t, REFRESH_SECRET) as JWTPayload;

export function getAuthUser(req: Request): JWTPayload | null {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
