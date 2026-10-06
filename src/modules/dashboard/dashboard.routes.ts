import { Router } from 'express';
import { getDashboardDataHandler } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/metrics', requirePermission('Dashboard', 'VIEW'), getDashboardDataHandler);

export default router;
