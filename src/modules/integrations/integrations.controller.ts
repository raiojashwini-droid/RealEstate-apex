import { Request, Response, NextFunction } from 'express';
import * as intService from './integrations.service';

export const listIntegrationsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await intService.getIntegrations();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const connectIntegrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user.id;
    const data = await intService.createOrUpdateIntegration(req.body, actorId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const disconnectIntegrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user.id;
    const data = await intService.disconnectIntegration(req.params.id as string, actorId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const testIntegrationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user.id;
    const data = await intService.testIntegration(req.params.id as string, actorId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
