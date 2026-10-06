import { Router } from 'express';
import { 
  getTasksListHandler, 
  createTaskHandler, 
  updateTaskHandler, 
  deleteTaskHandler 
} from './tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Task Manager', 'VIEW'), getTasksListHandler);
router.post('/', requirePermission('Task Manager', 'CREATE'), createTaskHandler);
router.put('/:id', requirePermission('Task Manager', 'EDIT'), updateTaskHandler);
router.delete('/:id', requirePermission('Task Manager', 'DELETE'), deleteTaskHandler);

export default router;
