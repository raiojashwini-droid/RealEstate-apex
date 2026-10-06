import { Router } from 'express';
import { 
  getDealsPipelineHandler, 
  createDealHandler, 
  updateDealStageHandler, 
  updateDealAnalysisHandler,
  deleteDealHandler 
} from './deals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', requirePermission('AI Deals & Offers', 'VIEW'), getDealsPipelineHandler);
router.get('/', requirePermission('AI Deals & Offers', 'VIEW'), getDealsPipelineHandler);
router.post('/', requirePermission('AI Deals & Offers', 'CREATE'), createDealHandler);
router.put('/:id/stage', requirePermission('AI Deals & Offers', 'EDIT'), updateDealStageHandler);
router.put('/:id/analysis', requirePermission('AI Deals & Offers', 'EDIT'), updateDealAnalysisHandler);
router.put('/:id', requirePermission('AI Deals & Offers', 'EDIT'), updateDealAnalysisHandler);
router.delete('/:id', requirePermission('AI Deals & Offers', 'DELETE'), deleteDealHandler);

export default router;
