"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUsers = async () => {
    return prisma_1.default.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            lastLoginAt: true,
            createdAt: true
        }
    });
};
exports.getUsers = getUsers;
const getUserById = async (id) => {
    return prisma_1.default.user.findUnique({
        where: { id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true }
    });
};
exports.getUserById = getUserById;
const createUser = async (data, actorId) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new Error('EMAIL_EXISTS');
    const passwordHash = await bcryptjs_1.default.hash(data.password || 'TempPassword123!', 12);
    return prisma_1.default.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                passwordHash
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true
            }
        });
        await tx.auditLog.create({
            data: {
                actorUserId: actorId,
                action: 'USER_CREATE',
                entityType: 'User',
                entityId: user.id,
                newValuesJson: JSON.stringify({ email: user.email, role: user.role })
            }
        });
        return user;
    });
};
exports.createUser = createUser;
const updateUserRole = async (id, newRole, actorId) => {
    return prisma_1.default.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true
            }
        });
        await tx.auditLog.create({
            data: {
                actorUserId: actorId,
                action: 'ROLE_CHANGE',
                entityType: 'User',
                entityId: user.id,
                newValuesJson: JSON.stringify({ role: newRole })
            }
        });
        return user;
    });
};
exports.updateUserRole = updateUserRole;
