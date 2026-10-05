import prisma from '../../prisma';
import { TaskPriority } from '@prisma/client';

export const formatTaskResponse = (t: any) => ({
  id: t.id,
  title: t.title,
  description: t.description || '',
  type: t.type || 'human_touch',
  status: t.status === 'PENDING' ? 'Open' : (t.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'),
  rawStatus: t.status,
  priority: t.priority,
  dueDate: t.dueAt ? t.dueAt.toISOString().split('T')[0] : 'Today',
  dueAt: t.dueAt,
  category: t.type === 'CALL' ? 'deal_offers' : (t.type === 'SMS' ? '5_touch_cadence' : 'general'),
  relatedDealId: t.dealId,
  relatedDealAddress: t.deal?.property?.address,
  relatedContactId: t.contactId,
  relatedContactName: t.contact?.fullName,
  assignedToId: t.assignedToId,
  assignedToName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
  createdAt: t.createdAt
});

export const getTasksList = async (userId?: string, role?: string, assignedToId?: string) => {
  const where: any = {};

  if (role === 'AGENT' || role === 'READ_ONLY') {
    if (userId) {
      where.assignedToId = userId;
    }
  } else if (role === 'MANAGER') {
    if (assignedToId) {
      where.assignedToId = assignedToId;
    } else if (userId) {
      where.assignedToId = userId;
    }
  } else if (assignedToId && assignedToId !== 'ALL') {
    where.assignedToId = assignedToId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: true,
      deal: { include: { property: true } },
      contact: true
    },
    orderBy: [{ createdAt: 'desc' }]
  });

  return tasks.map(formatTaskResponse);
};

export const createTask = async (data: any, creatorUserId?: string) => {
  let priority: TaskPriority = TaskPriority.NORMAL;
  if (data.priority === 'URGENT') priority = TaskPriority.URGENT;
  else if (data.priority === 'HIGH') priority = TaskPriority.HIGH;
  else if (data.priority === 'LOW') priority = TaskPriority.LOW;
  else if (data.priority === 'MEDIUM' || data.priority === 'NORMAL') priority = TaskPriority.NORMAL;

  let dueAt: Date | null = null;
  if (data.dueDate && data.dueDate !== 'Today') {
    const parsed = new Date(data.dueDate);
    if (!isNaN(parsed.getTime())) {
      dueAt = parsed;
    }
  }

  // Validate assignedToId if provided
  let assignedToId = data.assignedToId || creatorUserId || null;
  if (assignedToId) {
    const userExists = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!userExists) {
      assignedToId = creatorUserId || null;
    }
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || '',
      type: data.type || 'human_touch',
      priority,
      status: data.status || 'PENDING',
      assignedToId,
      contactId: data.contactId || null,
      dealId: data.dealId || null,
      dueAt
    },
    include: {
      assignedTo: true,
      deal: { include: { property: true } },
      contact: true
    }
  });

  return formatTaskResponse(task);
};

export const updateTask = async (id: string, data: any) => {
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  
  if (data.priority !== undefined) {
    if (data.priority === 'URGENT') updateData.priority = TaskPriority.URGENT;
    else if (data.priority === 'HIGH') updateData.priority = TaskPriority.HIGH;
    else if (data.priority === 'LOW') updateData.priority = TaskPriority.LOW;
    else updateData.priority = TaskPriority.NORMAL;
  }

  if (data.status !== undefined) {
    const normalizedStatus = data.status === 'Completed' || data.status === 'COMPLETED' ? 'COMPLETED' :
      (data.status === 'In Progress' || data.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING');
    updateData.status = normalizedStatus;
    if (normalizedStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  if (data.assignedToId !== undefined) {
    if (data.assignedToId) {
      const userExists = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      updateData.assignedToId = userExists ? data.assignedToId : null;
    } else {
      updateData.assignedToId = null;
    }
  }

  if (data.contactId !== undefined) updateData.contactId = data.contactId || null;
  if (data.dealId !== undefined) updateData.dealId = data.dealId || null;
  if (data.dueDate !== undefined) {
    const parsed = new Date(data.dueDate);
    updateData.dueAt = !isNaN(parsed.getTime()) ? parsed : null;
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: true,
      deal: { include: { property: true } },
      contact: true
    }
  });

  return formatTaskResponse(updated);
};

export const deleteTask = async (id: string) => {
  await prisma.task.delete({
    where: { id }
  });
  return { id, deleted: true };
};
