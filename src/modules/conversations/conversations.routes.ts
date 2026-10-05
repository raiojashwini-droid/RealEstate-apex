import { Router } from 'express';
import {
  getConversationsListHandler,
  createMessageHandler,
  updateConversationStatusHandler,
  overrideGradeHandler
} from './conversations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getConversationsListHandler);
router.post('/:id/messages', createMessageHandler);
router.patch('/:id/status', updateConversationStatusHandler);
router.post('/:id/grades', overrideGradeHandler);

export default router;
