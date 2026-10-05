import { Router } from 'express';
import { getTemplatesListHandler } from './templates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplatesListHandler);

export default router;
