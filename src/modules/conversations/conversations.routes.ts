import { Router } from 'express';
import { getConversationsListHandler } from './conversations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getConversationsListHandler);

export default router;
