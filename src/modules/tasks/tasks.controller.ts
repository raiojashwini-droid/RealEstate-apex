import { Request, Response, NextFunction } from 'express';
import * as tasksService from './tasks.service';

export const getTasksListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const assignedToId = req.query.assignedToId as string | undefined;
    const data = await tasksService.getTasksList(user?.id, user?.role, assignedToId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const data = await tasksService.createTask(req.body, userId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.status !== undefined;
    if (user?.role !== 'ADMIN' && !isOnlyStatusUpdate) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Admin can edit task details' });
    }
    const id = req.params.id as string;
    const data = await tasksService.updateTask(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Admin can delete tasks' });
    }
    const id = req.params.id as string;
    const data = await tasksService.deleteTask(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
