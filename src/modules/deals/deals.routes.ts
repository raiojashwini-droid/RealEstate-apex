import { Router } from 'express';
import { 
  getDealsPipelineHandler, 
  getDealByIdHandler,
  createDealHandler, 
  updateDealStageHandler, 
  updateDealAnalysisHandler,
  deleteDealHandler,
  bulkDeleteDealsHandler,
  assignDealHandler
} from './deals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', getDealsPipelineHandler);
router.get('/', getDealsPipelineHandler);
router.get('/:id', getDealByIdHandler);
router.post('/', createDealHandler);
router.post('/bulk-delete', bulkDeleteDealsHandler);
router.delete('/bulk', bulkDeleteDealsHandler);
router.put('/:id/stage', updateDealStageHandler);
router.put('/:id/assign', assignDealHandler);
router.put('/:id/analysis', updateDealAnalysisHandler);
router.put('/:id', updateDealAnalysisHandler);
router.delete('/:id', deleteDealHandler);

export default router;
