"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const tasks_service_1 = require("../tasks/tasks.service");
const getDashboardMetrics = async (userId, role) => {
    // If user is an AGENT, they only see their assigned contacts/deals.
    // Admin and Manager see everything.
    const isRestricted = role === 'AGENT' && !!userId;
    const contactFilter = isRestricted ? { ownerId: userId } : {};
    // 1. Total Realtor Contacts
    const totalContacts = await prisma_1.default.contact.count({ where: contactFilter });
    const activeContacts = await prisma_1.default.contact.count({ where: { ...contactFilter, status: { not: 'OPTED_OUT_DND' } } });
    const optOutContacts = await prisma_1.default.contact.count({ where: { ...contactFilter, status: 'OPTED_OUT_DND' } });
    // 2. Outreach Dispatched (24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messageFilter = isRestricted ? { contact: { ownerId: userId } } : {};
    const outreachDispatched = await prisma_1.default.message.count({
        where: { ...messageFilter, direction: 'OUTBOUND', createdAt: { gte: oneDayAgo } }
    });
    // Dynamic Reply Rate Calculation
    const respondedContacts = await prisma_1.default.contact.count({
        where: {
            ...contactFilter,
            status: { in: ['RESPONDED_QUALIFYING', 'NEEDS_HUMAN_TOUCH', 'LEAD_CREATED'] }
        }
    });
    const contactsWithOutreach = await prisma_1.default.contact.count({
        where: {
            ...contactFilter,
            status: { notIn: ['QUEUED_FOR_OUTREACH'] }
        }
    });
    const replyRate = contactsWithOutreach > 0
        ? Number(((respondedContacts / contactsWithOutreach) * 100).toFixed(1))
        : 0;
    // Dynamic SMS Channel Percentage Calculation
    const totalMessages = await prisma_1.default.message.count({ where: messageFilter });
    const smsMessages = await prisma_1.default.message.count({
        where: { ...messageFilter, channel: 'SMS' }
    });
    const smsPercentage = totalMessages > 0
        ? Math.round((smsMessages / totalMessages) * 100)
        : 100;
    // 3. Inbox Active Dialogs
    const conversationFilter = isRestricted ? { contact: { ownerId: userId } } : {};
    const activeThreads = await prisma_1.default.conversation.count({
        where: { ...conversationFilter, automationMode: 'AI_ACTIVE' }
    });
    const needsHuman = await prisma_1.default.conversation.count({
        where: { ...conversationFilter, automationMode: 'ESCALATED' }
    });
    // Dynamic Addresses / Properties Captured Count
    const dealFilter = isRestricted ? { contact: { ownerId: userId } } : {};
    const addresses = await prisma_1.default.deal.count({
        where: { ...dealFilter, status: { in: ['OPEN', 'WON'] } }
    });
    // 4. Pipeline Active Deals Volume
    const activeDealsList = await prisma_1.default.deal.findMany({
        where: { ...dealFilter, status: 'OPEN' },
        include: { property: true }
    });
    const activeDealsCount = activeDealsList.length;
    const activeDealsVolume = activeDealsList.reduce((acc, deal) => acc + (deal.property?.askingPrice || 0), 0);
    // 5. AI Qualification Telemetry
    const gradeFilter = isRestricted ? { conversation: { contact: { ownerId: userId } } } : {};
    const gradeA = await prisma_1.default.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'A' } });
    const gradeB = await prisma_1.default.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'B' } });
    const gradeC = await prisma_1.default.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'C' } });
    const gradeD = await prisma_1.default.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'D' } });
    const escalatedConversations = await prisma_1.default.conversation.findMany({
        where: { ...conversationFilter, automationMode: 'ESCALATED' },
        include: {
            contact: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            grades: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        take: 5
    });
    const priorityQueue = escalatedConversations.map(conv => {
        const latestMessage = conv.messages[0]?.body || 'No messages yet';
        return {
            id: conv.id,
            realtorName: conv.contact?.fullName || 'Unknown Realtor',
            brokerage: conv.contact?.brokerage || 'Unknown Brokerage',
            latestMessage,
            grade: conv.grades[0]?.letterGrade || 'N/A',
            tag: 'Needs Human'
        };
    });
    // 6. User Assigned Operational Tasks
    const taskWhere = {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
    };
    if (userId && isRestricted) {
        taskWhere.assignedToId = userId;
    }
    const assignedTasksRaw = await prisma_1.default.task.findMany({
        where: taskWhere,
        include: {
            assignedTo: true,
            deal: { include: { property: true } },
            contact: true
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 10
    });
    const assignedTasks = assignedTasksRaw.map(tasks_service_1.formatTaskResponse);
    return {
        metrics: {
            totalContacts,
            activeContacts,
            optOutContacts
        },
        activity: {
            outreachDispatched,
            replyRate,
            smsPercentage
        },
        inbox: {
            activeThreads,
            needsHuman,
            addresses
        },
        pipeline: {
            activeDealsCount,
            activeDealsVolume
        },
        aiTelemetry: {
            gradeA,
            gradeB,
            gradeC,
            gradeD,
            qualifiedCount: gradeA + gradeB
        },
        assignedTasks,
        priorityQueue
    };
};
exports.getDashboardMetrics = getDashboardMetrics;
