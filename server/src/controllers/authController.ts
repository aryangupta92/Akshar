import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, preferredLanguage } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      passwordHash, 
      preferredLanguage: preferredLanguage || 'hi' 
    });

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('accessToken', accessToken, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 
    });
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' 
    });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('accessToken', accessToken, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 
    });
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' 
    });

    res.json({ user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ success: true });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    if (!userPayload) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userPayload.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const payload = verifyRefreshToken(token);
    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, name: payload.name });

    res.cookie('accessToken', newAccessToken, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 
    });
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};
