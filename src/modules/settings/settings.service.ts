import prisma from '../../prisma';

export const getSystemSettings = async () => {
  let settings = await prisma.systemSettings.findFirst();
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        aiPersonaInstructions: 'You are an institutional acquisition bot...',
        aiConsecutiveReplyCap: 4,
        cadenceRetouchIntervalDays: 30,
        gradingWeightAddress: 35,
        gradingWeightPrice: 20
      }
    });
  }
  return settings;
};

export const updateSystemSettings = async (data: any) => {
  const existing = await prisma.systemSettings.findFirst();
  if (!existing) return null;
  return prisma.systemSettings.update({
    where: { id: existing.id },
    data
  });
};
