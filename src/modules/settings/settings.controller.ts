import { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service';

export const getSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await settingsService.getSystemSettings();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await settingsService.updateSystemSettings(req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
