import { Request, Response } from 'express';
import * as marketingService from './marketing.service';
import { SocialChannel } from '@prisma/client';

export const getSocialCredentials = async (req: Request, res: Response) => {
  try {
    const creds = await marketingService.getSocialCredentials();
    res.status(200).json({ success: true, data: creds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateSocialCredential = async (req: Request, res: Response) => {
  try {
    const channelRaw = req.params.channel;
    if (!channelRaw || typeof channelRaw !== 'string') {
      res.status(400).json({ success: false, error: { message: 'Invalid channel' } });
      return;
    }
    const channel = channelRaw.toUpperCase() as SocialChannel;
    const updated = await marketingService.updateSocialCredential(channel, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createMarketingPost = async (req: Request, res: Response) => {
  try {
    const post = await marketingService.createMarketingPost(req.body, (req as any).user.id);
    res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const dispatchSmsBlast = async (req: Request, res: Response) => {
  try {
    const blast = await marketingService.dispatchSmsBlast(req.body, (req as any).user.id);
    res.status(200).json({ success: true, data: blast });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
