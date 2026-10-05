import { Router } from 'express';
import { 
  getDealsPipelineHandler, 
  createDealHandler, 
  updateDealStageHandler, 
  updateDealAnalysisHandler,
  deleteDealHandler 
} from './deals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', getDealsPipelineHandler);
router.get('/', getDealsPipelineHandler);
router.post('/', createDealHandler);
router.put('/:id/stage', updateDealStageHandler);
router.put('/:id/analysis', updateDealAnalysisHandler);
router.put('/:id', updateDealAnalysisHandler);
router.delete('/:id', deleteDealHandler);

export default router;
