import { Router } from 'express';
import { getSettingsHandler, updateSettingsHandler } from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Settings', 'VIEW'), getSettingsHandler);
router.put('/', requirePermission('Settings', 'EDIT'), updateSettingsHandler);

export default router;
