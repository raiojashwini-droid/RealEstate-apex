"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportsDashboard = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getReportsDashboard = async () => {
    const auditLogs = await prisma_1.default.auditLog.findMany({
        include: {
            actor: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    const formattedLogs = auditLogs.map(log => ({
        id: log.id,
        actor: log.actor ? log.actor.firstName + ' ' + log.actor.lastName : 'System Bot',
        action: log.action,
        affectedRecord: log.entityType + ' ' + log.entityId,
        timestamp: log.createdAt.toISOString()
    }));
    const totalSmsSent = await prisma_1.default.message.count({
        where: { channel: 'SMS', direction: 'OUTBOUND' }
    });
    const emailTouchpoints = await prisma_1.default.message.count({
        where: { channel: 'EMAIL', direction: 'OUTBOUND' }
    });
    const deals = await prisma_1.default.deal.findMany({
        select: { status: true }
    });
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.status === 'WON').length;
    const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) + '%' : '0.0%';
    const metrics = {
        totalSmsSent: totalSmsSent.toString(),
        totalSmsTrend: 'Live system aggregate',
        emailTouchpoints: emailTouchpoints.toString(),
        emailTrend: 'Live system aggregate',
        avgResponseTime: 'N/A', // Complex metric to compute across disjoint tables, marking as N/A until proper tracking is in
        avgResponseSubtext: 'System metrics',
        dealConversion: conversionRate,
        dealConversionSubtext: 'Total Deals Conversion Rate'
    };
    return { metrics, auditLogs: formattedLogs };
};
exports.getReportsDashboard = getReportsDashboard;
