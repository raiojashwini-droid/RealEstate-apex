import prisma from '../../prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true
    }
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true }
  });
};

export const createUser = async (data: any, actorId: string) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(data.password || 'TempPassword123!', 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        passwordHash
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'USER_CREATE',
        entityType: 'User',
        entityId: user.id,
        newValuesJson: JSON.stringify({ email: user.email, role: user.role })
      }
    });

    return user;
  });
};

export const updateUserRole = async (id: string, newRole: any, actorId: string) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { role: newRole }
    });
    
    await tx.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'ROLE_CHANGE',
        entityType: 'User',
        entityId: user.id,
        newValuesJson: JSON.stringify({ role: newRole })
      }
    });
    return user;
  });
};
