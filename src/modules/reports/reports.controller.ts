import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';

export const getReportsDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportsService.getReportsDashboard();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
