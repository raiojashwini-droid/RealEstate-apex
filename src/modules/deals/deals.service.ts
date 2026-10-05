import prisma from '../../prisma';

export const getDealsPipeline = async (user?: { id: string; role: string }) => {
  const whereClause: any = {};
  
  if (user && user.role === 'AGENT') {
    whereClause.ownerId = user.id;
  }

  const deals = await prisma.deal.findMany({
    where: whereClause,
    include: {
      property: true,
      contact: true,
      stage: true,
      owner: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return deals.map(d => ({
    id: d.id,
    address: d.property.address,
    city: d.property.city,
    state: d.property.state,
    zip: d.property.zip,
    askingPrice: d.property.askingPrice || 0,
    contactId: d.contactId,
    contactName: d.contact.fullName,
    realtorName: d.contact.fullName,
    realtorBrokerage: d.contact.brokerage || 'Unknown',
    stage: d.stage.name,
    grade: d.gradeSnapshot || 'B',
    isArchived: d.status !== 'OPEN',
    ownerId: d.ownerId,
    ownerName: d.owner ? `${d.owner.firstName} ${d.owner.lastName}` : 'Unassigned',
    createdAt: d.createdAt.toISOString().split('T')[0],
    updatedAt: d.updatedAt.toISOString().split('T')[0],
    propertyDetails: {
      beds: d.property.beds,
      baths: d.property.baths,
      sqft: d.property.squareFeet,
      yearBuilt: d.property.yearBuilt,
      condition: 'Unknown',
      type: d.property.type
    }
  }));
};

export const createDeal = async (data: any, creatorUserId?: string) => {
  // 1. Resolve or create Contact
  let contact = null;
  if (data.contactId) {
    contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
  }

  if (!contact) {
    const rawPhone = data.realtorPhone || '5550000000';
    const normalizedMobilePhone = rawPhone.replace(/\D/g, '');
    const email = data.realtorEmail || `realtor_${Date.now()}@apexacquire.local`;
    const normalizedEmail = email.toLowerCase().trim();

    contact = await prisma.contact.create({
      data: {
        fullName: data.realtorName || 'New Realtor',
        brokerage: data.realtorBrokerage || 'Independent',
        mobilePhone: rawPhone,
        normalizedMobilePhone,
        email,
        normalizedEmail,
        status: 'QUEUED_FOR_OUTREACH'
      }
    });
  }

  // 2. Resolve or create Property
  const normalizedAddress = `${data.address} ${data.city || 'Dallas'} ${data.state || 'TX'} ${data.zip || '75205'}`.trim().toLowerCase();
  
  const property = await prisma.property.upsert({
    where: { normalizedAddress },
    update: {
      askingPrice: Number(data.askingPrice) || 0,
      beds: Number(data.beds) || 3,
      baths: Number(data.baths) || 2,
      squareFeet: Number(data.sqft) || 2000,
      yearBuilt: Number(data.yearBuilt) || 2000,
      type: data.propertyType || 'Single Family Residence'
    },
    create: {
      normalizedAddress,
      address: data.address,
      city: data.city || 'Dallas',
      state: data.state || 'TX',
      zip: data.zip || '75205',
      askingPrice: Number(data.askingPrice) || 0,
      beds: Number(data.beds) || 3,
      baths: Number(data.baths) || 2,
      squareFeet: Number(data.sqft) || 2000,
      yearBuilt: Number(data.yearBuilt) || 2000,
      type: data.propertyType || 'Single Family Residence'
    }
  });

  // 3. Resolve Pipeline & PipelineStage
  let pipeline = await prisma.pipeline.findFirst({
    include: { stages: true }
  });

  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        name: 'Property Acquisition Pipeline',
        type: 'STANDARD',
        stages: {
          create: [
            { name: 'New Property', orderIndex: 1, probability: 10 },
            { name: 'Qualifying', orderIndex: 2, probability: 25 },
            { name: 'Offer Made', orderIndex: 3, probability: 50 },
            { name: 'Offer Accepted', orderIndex: 4, probability: 80 },
            { name: 'Offer Rejected', orderIndex: 5, probability: 0 },
            { name: 'TRASH', orderIndex: 6, probability: 0 },
            { name: 'Duplicate Lead', orderIndex: 7, probability: 0 },
            { name: 'Need Help', orderIndex: 8, probability: 10 }
          ]
        }
      },
      include: { stages: true }
    });
  }

  const stageName = data.stage || 'New Property';
  let stageObj = pipeline.stages.find(s => s.name.toLowerCase() === stageName.toLowerCase());
  if (!stageObj) {
    stageObj = await prisma.pipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: stageName,
        orderIndex: pipeline.stages.length + 1,
        probability: 20
      }
    });
  }

  // 4. Resolve Owner ID
  let ownerId = data.ownerId || creatorUserId;
  if (ownerId) {
    const userExists = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!userExists) {
      ownerId = creatorUserId;
    }
  }
  if (!ownerId) {
    const firstUser = await prisma.user.findFirst();
    ownerId = firstUser?.id;
  }

  if (!ownerId) {
    throw new Error('No valid user found to assign as deal owner');
  }

  // 5. Create Deal
  const deal = await prisma.deal.create({
    data: {
      propertyId: property.id,
      contactId: contact.id,
      pipelineId: pipeline.id,
      stageId: stageObj.id,
      ownerId,
      source: 'MANUAL',
      gradeSnapshot: data.grade || 'B',
      status: 'OPEN'
    },
    include: {
      property: true,
      contact: true,
      stage: true,
      owner: true
    }
  });

  return {
    id: deal.id,
    address: deal.property.address,
    city: deal.property.city,
    state: deal.property.state,
    zip: deal.property.zip,
    askingPrice: deal.property.askingPrice || 0,
    contactId: deal.contactId,
    contactName: deal.contact.fullName,
    realtorName: deal.contact.fullName,
    realtorBrokerage: deal.contact.brokerage || 'Unknown',
    stage: deal.stage.name,
    grade: deal.gradeSnapshot || 'B',
    isArchived: deal.status !== 'OPEN',
    ownerId: deal.ownerId,
    ownerName: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned',
    createdAt: deal.createdAt.toISOString().split('T')[0],
    updatedAt: deal.updatedAt.toISOString().split('T')[0],
    propertyDetails: {
      beds: deal.property.beds,
      baths: deal.property.baths,
      sqft: deal.property.squareFeet,
      yearBuilt: deal.property.yearBuilt,
      condition: 'Unknown',
      type: deal.property.type
    }
  };
};

export const updateDealStage = async (dealId: string, stageName: string) => {
  let pipeline = await prisma.pipeline.findFirst({
    include: { stages: true }
  });

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  let stageObj = pipeline.stages.find(s => s.name.toLowerCase() === stageName.toLowerCase());
  if (!stageObj) {
    stageObj = await prisma.pipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: stageName,
        orderIndex: pipeline.stages.length + 1,
        probability: 20
      }
    });
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { stageId: stageObj.id },
    include: {
      property: true,
      contact: true,
      stage: true,
      owner: true
    }
  });

  return updatedDeal;
};

export const updateDealAnalysis = async (dealId: string, data: any) => {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { property: true }
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  const propertyUpdateData: any = {};
  if (data.askingPrice !== undefined) propertyUpdateData.askingPrice = Number(data.askingPrice);
  if (data.beds !== undefined) propertyUpdateData.beds = Number(data.beds);
  if (data.baths !== undefined) propertyUpdateData.baths = Number(data.baths);
  if (data.sqft !== undefined) propertyUpdateData.squareFeet = Number(data.sqft);
  if (data.yearBuilt !== undefined) propertyUpdateData.yearBuilt = Number(data.yearBuilt);
  if (data.propertyType !== undefined) propertyUpdateData.type = String(data.propertyType);

  if (Object.keys(propertyUpdateData).length > 0) {
    await prisma.property.update({
      where: { id: deal.propertyId },
      data: propertyUpdateData
    });
  }

  const updatedDeal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      property: true,
      contact: true,
      stage: true,
      owner: true
    }
  });

  return updatedDeal;
};

export const deleteDeal = async (id: string) => {
  return await prisma.deal.update({
    where: { id },
    data: { 
      status: 'LOST',
      deletedAt: new Date()
    }
  });
};
