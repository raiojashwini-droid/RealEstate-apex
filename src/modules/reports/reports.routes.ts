import { Router } from 'express';
import { getReportsDashboardHandler } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Reports & Audit', 'VIEW'), getReportsDashboardHandler);

export default router;
