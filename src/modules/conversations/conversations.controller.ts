import { Request, Response, NextFunction } from 'express';
import * as conversationsService from './conversations.service';

export const getConversationsListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await conversationsService.getConversationsList();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
