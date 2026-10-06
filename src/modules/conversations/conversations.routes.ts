import { Router } from 'express';
import { getConversationsListHandler } from './conversations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Conversations', 'VIEW'), getConversationsListHandler);

export default router;
