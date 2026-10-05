import prisma from '../../prisma';

export const getReportsDashboard = async () => {
  const auditLogs = await prisma.auditLog.findMany({
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

  const totalSmsSent = await prisma.message.count({
    where: { channel: 'SMS', direction: 'OUTBOUND' }
  });

  const emailTouchpoints = await prisma.message.count({
    where: { channel: 'EMAIL', direction: 'OUTBOUND' }
  });

  const deals = await prisma.deal.findMany({
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
