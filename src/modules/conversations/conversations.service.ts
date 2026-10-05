import prisma from '../../prisma';

export const resolveConversation = async (idOrContactId: string) => {
  // 1. Try finding conversation directly by conversation ID
  let conv = await prisma.conversation.findUnique({
    where: { id: idOrContactId },
    include: { contact: true }
  });

  if (conv) return conv;

  // 2. Check if id is prefixed with 'conv-' or is a contactId
  const cleanId = idOrContactId.startsWith('conv-') ? idOrContactId.replace('conv-', '') : idOrContactId;

  // Find contact
  const contact = await prisma.contact.findUnique({
    where: { id: cleanId }
  });

  if (contact) {
    // Find existing conversation for this contact
    conv = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
      include: { contact: true }
    });

    // If none exists, create a new Conversation record
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          automationMode: 'AI_ACTIVE',
          lastMessageAt: new Date()
        },
        include: { contact: true }
      });
    }
    return conv;
  }

  return null;
};

export const getConversationsList = async () => {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'asc' } },
      grades: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return conversations.map(conv => {
    const messages = conv.messages;
    const lastMessage = messages[messages.length - 1];
    const grade = conv.grades[0];
    
    return {
      id: conv.id,
      contactId: conv.contactId,
      realtorName: conv.contact.fullName,
      brokerage: conv.contact.brokerage || 'Independent',
      realtorPhone: conv.contact.mobilePhone,
      realtorEmail: conv.contact.email,
      latestMessage: lastMessage ? lastMessage.body : '',
      timestamp: lastMessage ? lastMessage.createdAt.toISOString().split('T')[1]!.substring(0, 5) : conv.updatedAt.toISOString().split('T')[1]!.substring(0, 5),
      unreadCount: conv.messages.filter(m => m.direction === 'INBOUND' && m.status === 'DELIVERED').length,
      status: conv.automationMode,
      aiStatus: conv.automationMode === 'ESCALATED' ? 'Human Takeover' : (conv.automationMode === 'AI_PAUSED' ? 'AI Off' : 'Active'),
      grade: grade ? grade.letterGrade : 'B',
      score: grade ? grade.score : 75,
      threadSummary: conv.escalatedReason || 'Dialogue in progress with realtor',
      isArchived: conv.automationMode === 'CLOSED',
      messages: messages.map(m => ({
        id: m.id,
        sender: m.direction === 'INBOUND' ? 'realtor' : (m.senderType === 'AI' ? 'ai' : 'human'),
        text: m.body,
        timestamp: m.createdAt.toISOString(),
        channel: m.channel.toLowerCase()
      }))
    };
  });
};

export const createMessage = async (
  conversationIdOrContactId: string,
  body: string,
  senderUserId?: string,
  channel: 'SMS' | 'EMAIL' = 'SMS'
) => {
  const conv = await resolveConversation(conversationIdOrContactId);
  if (!conv) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      contactId: conv.contactId,
      channel: channel as any,
      direction: 'OUTBOUND',
      senderType: senderUserId ? 'HUMAN' : 'AI',
      senderUserId: senderUserId || null,
      toAddress: conv.contact.mobilePhone || conv.contact.email || 'unknown',
      fromAddress: 'system-outreach',
      body,
      status: 'DELIVERED',
      sentAt: new Date(),
      deliveredAt: new Date()
    }
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      updatedAt: new Date()
    }
  });

  return {
    id: message.id,
    conversationId: conv.id,
    contactId: conv.contactId,
    sender: 'human',
    text: message.body,
    timestamp: message.createdAt.toISOString(),
    channel: message.channel.toLowerCase()
  };
};

export const updateConversationStatus = async (
  conversationIdOrContactId: string,
  aiStatus: string,
  userId?: string,
  reason?: string
) => {
  const conv = await resolveConversation(conversationIdOrContactId);
  if (!conv) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  let mode: any = 'AI_ACTIVE';
  if (aiStatus === 'Human Takeover' || aiStatus === 'ESCALATED' || aiStatus === 'HUMAN_ACTIVE') {
    mode = 'ESCALATED';
  } else if (aiStatus === 'AI Off' || aiStatus === 'AI_PAUSED') {
    mode = 'AI_PAUSED';
  } else if (aiStatus === 'CLOSED' || aiStatus === 'Archived') {
    mode = 'CLOSED';
  } else {
    mode = 'AI_ACTIVE';
  }

  const updatedConv = await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      automationMode: mode,
      escalatedReason: reason || (mode === 'ESCALATED' ? 'Human takeover initiated by agent' : null),
      humanTakeoverAt: mode === 'ESCALATED' ? new Date() : null,
      humanTakeoverById: mode === 'ESCALATED' ? (userId || null) : null
    },
    include: { contact: true }
  });

  if (mode === 'ESCALATED') {
    await prisma.contact.update({
      where: { id: conv.contactId },
      data: {
        status: 'NEEDS_HUMAN_TOUCH'
      }
    });
  }

  return {
    id: updatedConv.id,
    contactId: updatedConv.contactId,
    automationMode: updatedConv.automationMode,
    aiStatus: updatedConv.automationMode === 'ESCALATED' ? 'Human Takeover' : (updatedConv.automationMode === 'AI_PAUSED' ? 'AI Off' : 'Active')
  };
};

export const overrideGrade = async (
  conversationIdOrContactId: string,
  letterGrade: string,
  score: number,
  reason: string,
  userId?: string
) => {
  const conv = await resolveConversation(conversationIdOrContactId);
  if (!conv) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  const grade = await prisma.conversationGrade.create({
    data: {
      conversationId: conv.id,
      score: Number(score),
      letterGrade,
      criteriaJson: JSON.stringify({ manual: true, overriddenAt: new Date().toISOString() }),
      calculationVersion: 'manual_v1',
      isManualOverride: true,
      overrideReason: reason,
      overriddenById: userId || null
    }
  });

  return {
    id: grade.id,
    conversationId: conv.id,
    grade: grade.letterGrade,
    score: grade.score,
    overrideReason: grade.overrideReason
  };
};
