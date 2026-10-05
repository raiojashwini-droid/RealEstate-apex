import { Router } from 'express';
import { getDashboardDataHandler } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/metrics', getDashboardDataHandler);

export default router;
