import { Request, Response, NextFunction } from 'express';
import * as outreachService from './outreach.service';

export const getOutreachPipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await outreachService.getOutreachPipeline();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
