import { Router } from 'express';
import { getReportsDashboardHandler } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getReportsDashboardHandler);

export default router;
