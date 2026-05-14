import { Request, Response, NextFunction } from 'express';
import { getAuthUser } from '../utils/auth';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  (req as any).user = user;
  next();
};
