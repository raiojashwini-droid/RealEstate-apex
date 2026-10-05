import prisma from '../../prisma';
import { formatTaskResponse } from '../tasks/tasks.service';

export const getDashboardMetrics = async (userId?: string, role?: string) => {
  // If user is an AGENT, they only see their assigned contacts/deals.
  // Admin and Manager see everything.
  const isRestricted = role === 'AGENT' && !!userId;
  
  const contactFilter = isRestricted ? { ownerId: userId } : {};

  // 1. Total Realtor Contacts
  const totalContacts = await prisma.contact.count({ where: contactFilter });
  const activeContacts = await prisma.contact.count({ where: { ...contactFilter, status: { not: 'OPTED_OUT_DND' } } });
  const optOutContacts = await prisma.contact.count({ where: { ...contactFilter, status: 'OPTED_OUT_DND' } });

  // 2. Outreach Dispatched (24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const messageFilter = isRestricted ? { contact: { ownerId: userId } } : {};
  const outreachDispatched = await prisma.message.count({
    where: { ...messageFilter, direction: 'OUTBOUND', createdAt: { gte: oneDayAgo } }
  });

  // 3. Inbox Active Dialogs
  const conversationFilter = isRestricted ? { contact: { ownerId: userId } } : {};
  const activeThreads = await prisma.conversation.count({
    where: { ...conversationFilter, automationMode: 'AI_ACTIVE' }
  });
  const needsHuman = await prisma.conversation.count({
    where: { ...conversationFilter, automationMode: 'ESCALATED' }
  });

  // 4. Pipeline Active Deals Volume
  const dealFilter = isRestricted ? { contact: { ownerId: userId } } : {};
  const activeDealsList = await prisma.deal.findMany({
    where: { ...dealFilter, status: 'OPEN' },
    include: { property: true }
  });
  const activeDealsCount = activeDealsList.length;
  const activeDealsVolume = activeDealsList.reduce((acc, deal) => acc + (deal.property?.askingPrice || 0), 0);

  // 5. AI Qualification Telemetry
  const gradeFilter = isRestricted ? { conversation: { contact: { ownerId: userId } } } : {};
  const gradeA = await prisma.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'A' } });
  const gradeB = await prisma.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'B' } });
  const gradeC = await prisma.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'C' } });
  const gradeD = await prisma.conversationGrade.count({ where: { ...gradeFilter, letterGrade: 'D' } });

  const escalatedConversations = await prisma.conversation.findMany({
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
  const taskWhere: any = {
    status: { in: ['PENDING', 'IN_PROGRESS'] }
  };
  if (userId && isRestricted) {
    taskWhere.assignedToId = userId;
  }

  const assignedTasksRaw = await prisma.task.findMany({
    where: taskWhere,
    include: {
      assignedTo: true,
      deal: { include: { property: true } },
      contact: true
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 10
  });

  const assignedTasks = assignedTasksRaw.map(formatTaskResponse);

  return {
    metrics: {
      totalContacts,
      activeContacts,
      optOutContacts
    },
    activity: {
      outreachDispatched,
      replyRate: 18.4,
      smsPercentage: 84
    },
    inbox: {
      activeThreads,
      needsHuman,
      addresses: 0
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
