import { Router } from 'express';
import { 
  getTasksListHandler, 
  createTaskHandler, 
  updateTaskHandler, 
  deleteTaskHandler 
} from './tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTasksListHandler);
router.post('/', createTaskHandler);
router.put('/:id', updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export default router;
