import { Router } from 'express';
import { listUsersHandler, createUserHandler, changeRoleHandler, updateUserHandler, deleteUserHandler } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireManagerOrAbove } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, listUsersHandler);
router.post('/', authMiddleware, requireAdmin, createUserHandler);
router.put('/:id', authMiddleware, requireAdmin, updateUserHandler);
router.patch('/:id/role', authMiddleware, requireAdmin, changeRoleHandler);
router.delete('/:id', authMiddleware, requireAdmin, deleteUserHandler);

export default router;
