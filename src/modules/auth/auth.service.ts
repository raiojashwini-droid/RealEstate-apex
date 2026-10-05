import prisma from '../../prisma';
import { verifyPassword } from '../../utils/hash.util';
import { generateAccessToken, generateRefreshTokenHash } from '../../utils/jwt.util';

export const login = async (email: string, password: string, ipAddress?: string, userAgent?: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || !user.isActive) {
    throw new Error('AUTH_INVALID_CREDENTIALS');
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('AUTH_INVALID_CREDENTIALS');
  }

  const { rawToken, tokenHash } = generateRefreshTokenHash();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const accessToken = generateAccessToken({
    sub: user.id,
    sessionId: session.id,
    role: user.role
  });

  return {
    accessToken,
    refreshToken: rawToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  };
};

export const logout = async (sessionId: string) => {
  await prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() }
  });
};

export const getMe = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLoginAt: true
    }
  });
};

export const refresh = async (refreshToken: string) => {
  // Hash the incoming refresh token to match the DB
  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await prisma.authSession.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
  });

  if (!session) {
    throw new Error('AUTH_INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) {
    throw new Error('AUTH_INVALID_TOKEN');
  }

  const accessToken = generateAccessToken({
    sub: user.id,
    sessionId: session.id,
    role: user.role
  });

  return { accessToken };
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('AUTH_INVALID_CREDENTIALS');

  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) throw new Error('AUTH_INVALID_CREDENTIALS');

  const bcrypt = require('bcryptjs');
  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: userId
    }
  });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) return; // Silent fail

  // In a real app, generate a reset token, store hash in DB, and send email
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id
    }
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  // Dummy logic, real logic would verify token
  throw new Error('AUTH_INVALID_TOKEN');
};
