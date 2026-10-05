import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export const getDashboardDataHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const data = await dashboardService.getDashboardMetrics(user?.id, user?.role);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
