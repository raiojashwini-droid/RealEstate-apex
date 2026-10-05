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
      permissions: true,
      lastLoginAt: true,
      createdAt: true
    }
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, permissions: true }
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

export const updateUser = async (id: string, data: any, actorId: string) => {
  return prisma.$transaction(async (tx) => {
    let updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      jobTitle: data.jobTitle,
      permissions: data.permissions !== undefined ? data.permissions : undefined,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const user = await tx.user.update({
      where: { id },
      data: updateData
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'USER_UPDATE',
        entityType: 'User',
        entityId: user.id,
        newValuesJson: JSON.stringify({ email: user.email, role: user.role, firstName: user.firstName })
      }
    });
    return user;
  });
};

export const deleteUser = async (id: string, actorId: string) => {
  // We perform these sequentially to avoid transaction timeouts or obscured FK errors.
  
  // 1. Fetch user to get email for the audit log
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('USER_NOT_FOUND');

  // 2. Unassign optional relations
  await prisma.contact.updateMany({ where: { ownerId: id }, data: { ownerId: null } });
  await prisma.task.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
  await prisma.auditLog.updateMany({ where: { actorUserId: id }, data: { actorUserId: null } });
  
  // 3. Reassign required relations to the admin (actorId)
  await prisma.deal.updateMany({ where: { ownerId: id }, data: { ownerId: actorId } });
  await prisma.callLog.updateMany({ where: { userId: id }, data: { userId: actorId } });

  // 4. Delete the user
  const deletedUser = await prisma.user.delete({
    where: { id }
  });

  // 5. Create audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: actorId,
      action: 'USER_DELETE',
      entityType: 'User',
      entityId: id,
      oldValuesJson: JSON.stringify({ email: user.email })
    }
  });

  return deletedUser;
};
