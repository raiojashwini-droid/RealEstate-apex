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

export const createMessageHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { text, channel } = req.body;
    const userId = (req as any).user?.id;

    if (!id || !text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Conversation ID and message text are required' }
      });
    }

    const data = await conversationsService.createMessage(id, text.trim(), userId, channel);
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }
    next(error);
  }
};

export const updateConversationStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { aiStatus, status, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Conversation ID is required' }
      });
    }

    const targetStatus = aiStatus || status || 'Active';
    const data = await conversationsService.updateConversationStatus(id, targetStatus, userId, reason);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }
    next(error);
  }
};

export const overrideGradeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { grade, score, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!id || !grade || score === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Conversation ID, grade, and score are required' }
      });
    }

    const data = await conversationsService.overrideGrade(
      id,
      grade,
      Number(score),
      reason || 'Manual grade override',
      userId
    );
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }
    next(error);
  }
};
