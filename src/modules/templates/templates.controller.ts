import { Request, Response, NextFunction } from 'express';
import * as templatesService from './templates.service';

export const getTemplatesListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await templatesService.getTemplatesList();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
