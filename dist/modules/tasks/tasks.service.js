"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasksList = exports.formatTaskResponse = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const client_1 = require("@prisma/client");
const formatTaskResponse = (t) => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    type: t.type || 'human_touch',
    status: t.status === 'PENDING' ? 'Open' : (t.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'),
    rawStatus: t.status,
    priority: t.priority,
    dueDate: t.dueAt ? t.dueAt.toISOString().split('T')[0] : 'Today',
    dueAt: t.dueAt,
    category: t.type === 'CALL' ? 'deal_offers' : (t.type === 'SMS' ? '5_touch_cadence' : 'general'),
    relatedDealId: t.dealId,
    relatedDealAddress: t.deal?.property?.address,
    relatedContactId: t.contactId,
    relatedContactName: t.contact?.fullName,
    assignedToId: t.assignedToId,
    assignedToName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
    createdAt: t.createdAt
});
exports.formatTaskResponse = formatTaskResponse;
const getTasksList = async (userId, role, assignedToId) => {
    const where = {};
    if (role === 'AGENT' || role === 'READ_ONLY') {
        if (userId) {
            where.assignedToId = userId;
        }
    }
    else if (role === 'MANAGER') {
        if (assignedToId) {
            where.assignedToId = assignedToId;
        }
        else if (userId) {
            where.assignedToId = userId;
        }
    }
    else if (assignedToId && assignedToId !== 'ALL') {
        where.assignedToId = assignedToId;
    }
    const tasks = await prisma_1.default.task.findMany({
        where,
        include: {
            assignedTo: true,
            deal: { include: { property: true } },
            contact: true
        },
        orderBy: [{ createdAt: 'desc' }]
    });
    return tasks.map(exports.formatTaskResponse);
};
exports.getTasksList = getTasksList;
const createTask = async (data, creatorUserId) => {
    let priority = client_1.TaskPriority.NORMAL;
    if (data.priority === 'URGENT')
        priority = client_1.TaskPriority.URGENT;
    else if (data.priority === 'HIGH')
        priority = client_1.TaskPriority.HIGH;
    else if (data.priority === 'LOW')
        priority = client_1.TaskPriority.LOW;
    else if (data.priority === 'MEDIUM' || data.priority === 'NORMAL')
        priority = client_1.TaskPriority.NORMAL;
    let dueAt = null;
    if (data.dueDate && data.dueDate !== 'Today') {
        const parsed = new Date(data.dueDate);
        if (!isNaN(parsed.getTime())) {
            dueAt = parsed;
        }
    }
    // Validate assignedToId if provided
    let assignedToId = data.assignedToId || creatorUserId || null;
    if (assignedToId) {
        const userExists = await prisma_1.default.user.findUnique({ where: { id: assignedToId } });
        if (!userExists) {
            assignedToId = creatorUserId || null;
        }
    }
    const task = await prisma_1.default.task.create({
        data: {
            title: data.title,
            description: data.description || '',
            type: data.type || 'human_touch',
            priority,
            status: data.status || 'PENDING',
            assignedToId,
            contactId: data.contactId || null,
            dealId: data.dealId || null,
            dueAt
        },
        include: {
            assignedTo: true,
            deal: { include: { property: true } },
            contact: true
        }
    });
    return (0, exports.formatTaskResponse)(task);
};
exports.createTask = createTask;
const updateTask = async (id, data) => {
    const updateData = {};
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.priority !== undefined) {
        if (data.priority === 'URGENT')
            updateData.priority = client_1.TaskPriority.URGENT;
        else if (data.priority === 'HIGH')
            updateData.priority = client_1.TaskPriority.HIGH;
        else if (data.priority === 'LOW')
            updateData.priority = client_1.TaskPriority.LOW;
        else
            updateData.priority = client_1.TaskPriority.NORMAL;
    }
    if (data.status !== undefined) {
        const normalizedStatus = data.status === 'Completed' || data.status === 'COMPLETED' ? 'COMPLETED' :
            (data.status === 'In Progress' || data.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING');
        updateData.status = normalizedStatus;
        if (normalizedStatus === 'COMPLETED') {
            updateData.completedAt = new Date();
        }
        else {
            updateData.completedAt = null;
        }
    }
    if (data.assignedToId !== undefined) {
        if (data.assignedToId) {
            const userExists = await prisma_1.default.user.findUnique({ where: { id: data.assignedToId } });
            updateData.assignedToId = userExists ? data.assignedToId : null;
        }
        else {
            updateData.assignedToId = null;
        }
    }
    if (data.contactId !== undefined)
        updateData.contactId = data.contactId || null;
    if (data.dealId !== undefined)
        updateData.dealId = data.dealId || null;
    if (data.dueDate !== undefined) {
        const parsed = new Date(data.dueDate);
        updateData.dueAt = !isNaN(parsed.getTime()) ? parsed : null;
    }
    const updated = await prisma_1.default.task.update({
        where: { id },
        data: updateData,
        include: {
            assignedTo: true,
            deal: { include: { property: true } },
            contact: true
        }
    });
    return (0, exports.formatTaskResponse)(updated);
};
exports.updateTask = updateTask;
const deleteTask = async (id) => {
    await prisma_1.default.task.delete({
        where: { id }
    });
    return { id, deleted: true };
};
exports.deleteTask = deleteTask;
