import prisma from '../../prisma';

export const getConversationsList = async () => {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'desc' } },
      grades: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return conversations.map(conv => {
    const lastMessage = conv.messages[0];
    const grade = conv.grades[0];
    
    return {
      id: conv.id,
      contactId: conv.contactId,
      realtorName: conv.contact.fullName,
      brokerage: conv.contact.brokerage || 'Unknown',
      realtorPhone: conv.contact.mobilePhone,
      realtorEmail: conv.contact.email,
      latestMessage: lastMessage ? lastMessage.body : '',
      timestamp: lastMessage ? lastMessage.createdAt.toISOString().split('T')[1]!.substring(0, 5) : conv.updatedAt.toISOString().split('T')[1]!.substring(0, 5),
      unreadCount: conv.messages.filter(m => m.direction === 'INBOUND' && m.status === 'DELIVERED').length,
      status: conv.automationMode,
      aiStatus: conv.automationMode === 'ESCALATED' ? 'Human Takeover' : 'Active',
      grade: grade ? grade.letterGrade : 'C',
      score: grade ? grade.score : 0,
      threadSummary: conv.escalatedReason || 'No summary available',
      isArchived: conv.automationMode === 'CLOSED',
      messages: conv.messages.reverse().map(m => ({
        id: m.id,
        sender: m.direction === 'INBOUND' ? 'realtor' : (m.senderType === 'AI' ? 'ai' : 'agent'),
        text: m.body,
        timestamp: m.createdAt.toISOString(),
        channel: m.channel.toLowerCase()
      }))
    };
  });
};
