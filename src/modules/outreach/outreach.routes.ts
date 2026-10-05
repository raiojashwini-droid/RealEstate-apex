import { Router } from 'express';
import { getOutreachPipelineHandler } from './outreach.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', getOutreachPipelineHandler);

export default router;
