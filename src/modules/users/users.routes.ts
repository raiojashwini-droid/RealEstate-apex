import { Router } from 'express';
import { listUsersHandler, createUserHandler, changeRoleHandler, updateUserHandler, deleteUserHandler } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Settings', 'VIEW'), listUsersHandler);
router.post('/', requirePermission('Settings', 'CREATE'), createUserHandler);
router.put('/:id', requirePermission('Settings', 'EDIT'), updateUserHandler);
router.patch('/:id/role', requirePermission('Settings', 'EDIT'), changeRoleHandler);
router.delete('/:id', requirePermission('Settings', 'DELETE'), deleteUserHandler);

export default router;
