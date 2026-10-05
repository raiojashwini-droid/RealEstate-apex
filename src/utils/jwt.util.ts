import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET is not set in production.');
    }
    console.warn('WARNING: Using default insecure JWT_SECRET. Set JWT_SECRET in .env');
    return 'super_secret';
  }
  return secret;
};

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export interface JwtPayload {
  sub: string;
  sessionId: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: EXPIRES_IN as any });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
};

export const generateRefreshTokenHash = (): { rawToken: string; tokenHash: string } => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};
