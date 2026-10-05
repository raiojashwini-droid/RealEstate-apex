"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const prisma_1 = __importDefault(require("../prisma"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized access' } });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized access' } });
        }
        const payload = (0, jwt_util_1.verifyAccessToken)(token);
        const session = await prisma_1.default.authSession.findUnique({
            where: { id: payload.sessionId }
        });
        if (!session || session.revokedAt) {
            return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Session expired or revoked' } });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.sub }
        });
        if (!user || !user.isActive) {
            return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Account is deactivated' } });
        }
        // Attach user payload to request
        req.user = { id: user.id, role: user.role, sessionId: session.id };
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid token' } });
    }
};
exports.authMiddleware = authMiddleware;
