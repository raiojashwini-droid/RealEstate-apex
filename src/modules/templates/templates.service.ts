import prisma from '../../prisma';

export const getTemplatesList = async () => {
  const templates = await prisma.outreachTemplate.findMany({
    orderBy: { touchNumber: 'asc' }
  });

  return templates.map(t => ({
    id: t.id,
    channel: t.channel.toLowerCase(),
    name: t.name,
    touchNumber: t.touchNumber,
    subject: t.subject,
    body: t.body,
    isActive: t.isActive,
    category: t.name.toLowerCase().includes('offer') ? 'deal_offers' : '5_touch_cadence',
    variables: ['first_name', 'market', 'property_address']
  }));
};
