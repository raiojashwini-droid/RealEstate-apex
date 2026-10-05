import { ContactStatus, ContactTemperature } from '@prisma/client';
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

const mapContactStatusToDB = (status?: string): ContactStatus => {
  if (!status) return ContactStatus.QUEUED_FOR_OUTREACH;
  const s = status.toLowerCase();
  if (s.includes('sent')) return ContactStatus.OUTREACH_SENT;
  if (s.includes('qualifying') || s.includes('responded')) return ContactStatus.RESPONDED_QUALIFYING;
  if (s.includes('human')) return ContactStatus.NEEDS_HUMAN_TOUCH;
  if (s.includes('lead')) return ContactStatus.LEAD_CREATED;
  if (s.includes('nurture') || s.includes('no response')) return ContactStatus.NURTURE_30_DAY;
  if (s.includes('not interested')) return ContactStatus.NOT_INTERESTED;
  if (s.includes('wrong')) return ContactStatus.WRONG_NUMBER;
  if (s.includes('opted') || s.includes('dnd') || s.includes('sms error')) return ContactStatus.OPTED_OUT_DND;
  return ContactStatus.QUEUED_FOR_OUTREACH;
};

const mapTemperatureToUI = (temp?: ContactTemperature | null): 'Hot' | 'Warm' | 'Cold' => {
  if (temp === 'HOT') return 'Hot';
  if (temp === 'COLD') return 'Cold';
  return 'Warm';
};

const mapTemperatureToDB = (temp?: string): ContactTemperature => {
  if (!temp) return ContactTemperature.WARM;
  const t = temp.toUpperCase();
  if (t === 'HOT') return ContactTemperature.HOT;
  if (t === 'COLD') return ContactTemperature.COLD;
  return ContactTemperature.WARM;
};

export const formatContactResponse = (c: any) => {
  const cad = c.cadenceEnrollments?.[0];
  const conv = c.conversations?.[0];
  const grade = conv?.grades?.[0];

  return {
    id: c.id,
    name: c.fullName,
    fullName: c.fullName,
    brokerage: c.brokerage || 'Unknown',
    license: c.licenseNumber || 'Unverified',
    licenseNumber: c.licenseNumber || 'Unverified',
    email: c.email || 'N/A',
    phone: c.mobilePhone || 'N/A',
    market: c.market || 'Dallas Metro',
    status: mapContactStatusToUI(c.status),
    outreachStage: mapContactStatusToUI(c.status),
    temperature: mapTemperatureToUI(c.temperature),
    tags: ['Realtor Directory', c.market || 'Dallas Metro'],
    lastContacted: c.lastContactedAt ? c.lastContactedAt.toISOString().split('T')[0] : 'Never',
    lastContactDate: c.lastContactedAt ? c.lastContactedAt.toISOString().split('T')[0] : 'Never',
    lastResponse: c.lastResponseAt ? c.lastResponseAt.toISOString().split('T')[0] : 'None',
    sequenceInfo: {
      currentTouch: cad?.touchNumber || 0,
      totalTouches: 5,
      recycleCount: 0,
      nurtureDay: 18,
      lastTouchDate: c.lastContactedAt ? c.lastContactedAt.toISOString().split('T')[0] : 'Never',
      nextScheduledTouch: 'Touch 1 Ready',
      channel: 'sms' as const
    },
    ownerId: c.ownerId || '',
    ownerName: c.owner?.name || 'Alexander Vance',
    grade: grade?.letterGrade || 'B',
    score: grade?.score || 75,
    propertyDealIds: c.deals ? c.deals.map((d: any) => d.id) : [],
    notes: c.notes ? c.notes.map((n: any) => n.body) : [],
    isArchived: Boolean(c.deletedAt)
  };
};

export const getContactsList = async () => {
  const contacts = await prisma.contact.findMany({
    where: {
      deletedAt: null
    },
    include: {
      owner: true,
      cadenceEnrollments: { orderBy: { createdAt: 'desc' }, take: 1 },
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { grades: { orderBy: { createdAt: 'desc' }, take: 1 } }
      },
      deals: true,
      notes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return contacts.map(formatContactResponse);
};

export const createContact = async (data: any, defaultOwnerId?: string) => {
  const fullName = data.name || data.fullName || 'Unnamed Realtor';
  const email = data.email ? data.email.trim() : null;
  const phone = data.phone ? data.phone.trim() : (data.mobilePhone ? data.mobilePhone.trim() : null);
  const brokerage = data.brokerage || null;
  const licenseNumber = data.licenseNumber || data.license || null;
  const market = data.market || 'Dallas Metro';
  const status = mapContactStatusToDB(data.outreachStage || data.status);
  const temperature = mapTemperatureToDB(data.temperature);
  const ownerId = data.ownerId || defaultOwnerId || null;

  const contact = await prisma.contact.create({
    data: {
      fullName,
      email,
      normalizedEmail: email ? email.toLowerCase() : null,
      mobilePhone: phone,
      normalizedMobilePhone: phone ? phone.replace(/[^0-9]/g, '') : null,
      brokerage,
      licenseNumber,
      market,
      status,
      temperature,
      ownerId
    },
    include: {
      owner: true,
      cadenceEnrollments: true,
      conversations: { include: { grades: true } },
      deals: true,
      notes: true
    }
  });

  return formatContactResponse(contact);
};

export const updateContact = async (id: string, data: any) => {
  const updateData: any = {};
  if (data.name !== undefined || data.fullName !== undefined) {
    updateData.fullName = data.name || data.fullName;
  }
  if (data.email !== undefined) {
    updateData.email = data.email ? data.email.trim() : null;
    updateData.normalizedEmail = data.email ? data.email.trim().toLowerCase() : null;
  }
  if (data.phone !== undefined || data.mobilePhone !== undefined) {
    const ph = data.phone !== undefined ? data.phone : data.mobilePhone;
    updateData.mobilePhone = ph ? ph.trim() : null;
    updateData.normalizedMobilePhone = ph ? ph.replace(/[^0-9]/g, '') : null;
  }
  if (data.brokerage !== undefined) {
    updateData.brokerage = data.brokerage;
  }
  if (data.licenseNumber !== undefined || data.license !== undefined) {
    updateData.licenseNumber = data.licenseNumber !== undefined ? data.licenseNumber : data.license;
  }
  if (data.market !== undefined) {
    updateData.market = data.market;
  }
  if (data.status !== undefined || data.outreachStage !== undefined) {
    updateData.status = mapContactStatusToDB(data.status || data.outreachStage);
  }
  if (data.temperature !== undefined) {
    updateData.temperature = mapTemperatureToDB(data.temperature);
  }
  if (data.ownerId !== undefined) {
    updateData.ownerId = data.ownerId || null;
  }
  if (data.isArchived !== undefined) {
    updateData.deletedAt = data.isArchived ? new Date() : null;
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
    include: {
      owner: true,
      cadenceEnrollments: { orderBy: { createdAt: 'desc' }, take: 1 },
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { grades: { orderBy: { createdAt: 'desc' }, take: 1 } }
      },
      deals: true,
      notes: { where: { deletedAt: null } }
    }
  });

  return formatContactResponse(contact);
};

export const deleteContact = async (id: string) => {
  return await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

export const bulkCreateContacts = async (contactsList: any[], defaultOwnerId?: string) => {
  const created = [];
  for (const item of contactsList) {
    try {
      const res = await createContact(item, defaultOwnerId);
      created.push(res);
    } catch (err) {
      console.error('Failed to import contact:', err);
    }
  }
  return created;
};
