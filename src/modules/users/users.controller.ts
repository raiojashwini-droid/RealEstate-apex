import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';

export const listUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const createUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user.id;
    const user = await usersService.createUser(req.body, actorId);
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
    }
    next(err);
  }
};

export const changeRoleHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user.id;
    const user = await usersService.updateUserRole(req.params.id as string, req.body.role, actorId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
