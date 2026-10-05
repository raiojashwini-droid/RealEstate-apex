import { ContactTemperature } from '@prisma/client';
import prisma from '../../prisma';

const mapContactStatusToUI = (status: string): string => {
  switch (status) {
    case 'QUEUED_FOR_OUTREACH':
      return 'Queued for Outreach';
    case 'OUTREACH_SENT':
      return 'Outreach Sent';
    case 'RESPONDED_QUALIFYING':
      return 'Responded/Qualifying';
    case 'NEEDS_HUMAN_TOUCH':
      return 'Needs Human Touch';
    case 'LEAD_CREATED':
      return 'Lead Created';
    case 'NURTURE_30_DAY':
      return 'No Response, In 30-Day Nurture';
    case 'NOT_INTERESTED':
      return 'Not Interested - CLOSED';
    case 'WRONG_NUMBER':
      return 'Wrong Number / Not an Agent - CLOSED';
    case 'OPTED_OUT_DND':
      return 'Opted Out / DND - CLOSED';
    default:
      return status || 'Queued for Outreach';
  }
};

const mapTemperatureToUI = (temp?: ContactTemperature | null): 'Hot' | 'Warm' | 'Cold' => {
  if (temp === 'HOT') return 'Hot';
  if (temp === 'COLD') return 'Cold';
  return 'Warm';
};

export const getOutreachPipeline = async () => {
  const contacts = await prisma.contact.findMany({
    where: {
      deletedAt: null
    },
    include: {
      cadenceEnrollments: { orderBy: { createdAt: 'desc' }, take: 1 },
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { grades: { orderBy: { createdAt: 'desc' }, take: 1 } }
      },
      deals: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return contacts.map(c => {
    const cad = c.cadenceEnrollments[0];
    const conv = c.conversations[0];
    const grade = conv?.grades[0];

    return {
      id: c.id,
      name: c.fullName,
      phone: c.mobilePhone || '(Unmapped)',
      brokerage: c.brokerage || 'Unknown Brokerage',
      market: c.market || 'Dallas Metro',
      temperature: mapTemperatureToUI(c.temperature),
      outreachStage: mapContactStatusToUI(c.status),
      status: mapContactStatusToUI(c.status),
      grade: grade?.letterGrade || 'B',
      score: grade?.score || 75,
      sequenceInfo: {
        currentTouch: cad ? cad.touchNumber : 0,
        totalTouches: 5,
        recycleCount: 0,
        nurtureDay: 18,
        lastTouchDate: c.lastContactedAt ? c.lastContactedAt.toISOString().split('T')[0] : 'Never',
        nextScheduledTouch: 'Touch 1 Ready',
        channel: 'sms' as const
      },
      propertyDealIds: c.deals.map(d => d.id)
    };
  });
};
