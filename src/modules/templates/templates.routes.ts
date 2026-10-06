import { Router } from 'express';
import { getTemplatesListHandler } from './templates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Templates & Automations', 'VIEW'), getTemplatesListHandler);

export default router;
