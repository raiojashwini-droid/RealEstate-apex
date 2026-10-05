import { Router } from 'express';
import { getSettingsHandler, updateSettingsHandler } from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettingsHandler);
router.put('/', updateSettingsHandler);

export default router;
