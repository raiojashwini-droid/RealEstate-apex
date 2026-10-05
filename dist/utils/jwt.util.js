"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshTokenHash = exports.verifyAccessToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const getJwtSecret = () => {
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
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: EXPIRES_IN });
};
exports.generateAccessToken = generateAccessToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, getJwtSecret());
};
exports.verifyAccessToken = verifyAccessToken;
const generateRefreshTokenHash = () => {
    const rawToken = crypto_1.default.randomBytes(40).toString('hex');
    const tokenHash = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
};
exports.generateRefreshTokenHash = generateRefreshTokenHash;
