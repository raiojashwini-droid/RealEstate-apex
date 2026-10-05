import { Request, Response, NextFunction } from 'express';
import * as dealsService from './deals.service';

export const getDealsPipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const data = await dealsService.getDealsPipeline(user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createDealHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const deal = await dealsService.createDeal(req.body, userId);
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

export const updateDealStageHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const stage = String(req.body.stage || '');
    const updated = await dealsService.updateDealStage(id, stage);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const updateDealAnalysisHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = await dealsService.updateDealAnalysis(id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDealHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await dealsService.deleteDeal(id);
    res.status(200).json({ success: true, message: 'Deal archived successfully' });
  } catch (error) {
    next(error);
  }
};
