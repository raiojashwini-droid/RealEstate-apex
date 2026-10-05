"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockReadOnly = exports.requireAgentOrAbove = exports.requireManagerOrAbove = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Not authenticated' } });
        }
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden: Insufficient privileges' } });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
exports.requireManagerOrAbove = (0, exports.requireRole)(['ADMIN', 'MANAGER']);
exports.requireAgentOrAbove = (0, exports.requireRole)(['ADMIN', 'MANAGER', 'AGENT']);
const blockReadOnly = (req, res, next) => {
    const userRole = req.user?.role;
    if (userRole === 'READ_ONLY') {
        return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden: Read-only users cannot perform this action' } });
    }
    next();
};
exports.blockReadOnly = blockReadOnly;
