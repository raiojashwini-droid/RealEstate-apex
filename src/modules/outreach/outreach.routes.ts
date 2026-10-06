import { Router } from 'express';
import { getOutreachPipelineHandler } from './outreach.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', requirePermission('Outreach Pipeline', 'VIEW'), getOutreachPipelineHandler);

export default router;
