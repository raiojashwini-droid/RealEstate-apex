"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.refresh = exports.getMe = exports.logout = exports.login = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const hash_util_1 = require("../../utils/hash.util");
const jwt_util_1 = require("../../utils/jwt.util");
const login = async (email, password, ipAddress, userAgent) => {
    const user = await prisma_1.default.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    if (!user || !user.isActive) {
        throw new Error('AUTH_INVALID_CREDENTIALS');
    }
    const isPasswordValid = await (0, hash_util_1.verifyPassword)(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error('AUTH_INVALID_CREDENTIALS');
    }
    const { rawToken, tokenHash } = (0, jwt_util_1.generateRefreshTokenHash)();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await prisma_1.default.authSession.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null
        }
    });
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    const accessToken = (0, jwt_util_1.generateAccessToken)({
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
exports.login = login;
const logout = async (sessionId) => {
    await prisma_1.default.authSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() }
    });
};
exports.logout = logout;
const getMe = async (userId) => {
    return await prisma_1.default.user.findUnique({
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
exports.getMe = getMe;
const refresh = async (refreshToken) => {
    // Hash the incoming refresh token to match the DB
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await prisma_1.default.authSession.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });
    if (!session) {
        throw new Error('AUTH_INVALID_TOKEN');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) {
        throw new Error('AUTH_INVALID_TOKEN');
    }
    const accessToken = (0, jwt_util_1.generateAccessToken)({
        sub: user.id,
        sessionId: session.id,
        role: user.role
    });
    return { accessToken };
};
exports.refresh = refresh;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('AUTH_INVALID_CREDENTIALS');
    const isPasswordValid = await (0, hash_util_1.verifyPassword)(currentPassword, user.passwordHash);
    if (!isPasswordValid)
        throw new Error('AUTH_INVALID_CREDENTIALS');
    const bcrypt = require('bcryptjs');
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { passwordHash: newHash }
    });
    // Create audit log
    await prisma_1.default.auditLog.create({
        data: {
            actorUserId: userId,
            action: 'PASSWORD_CHANGE',
            entityType: 'User',
            entityId: userId
        }
    });
};
exports.changePassword = changePassword;
const forgotPassword = async (email) => {
    const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive)
        return; // Silent fail
    // In a real app, generate a reset token, store hash in DB, and send email
    await prisma_1.default.auditLog.create({
        data: {
            actorUserId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'User',
            entityId: user.id
        }
    });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    // Dummy logic, real logic would verify token
    throw new Error('AUTH_INVALID_TOKEN');
};
exports.resetPassword = resetPassword;
