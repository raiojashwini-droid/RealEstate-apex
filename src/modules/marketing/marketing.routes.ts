import { Router } from 'express';
import * as marketingController from './marketing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/social', requirePermission('Marketing', 'VIEW'), marketingController.getSocialCredentials);
router.put('/social/:channel', requirePermission('Marketing', 'EDIT'), marketingController.updateSocialCredential);
router.post('/post', requirePermission('Marketing', 'CREATE'), marketingController.createMarketingPost);
router.post('/blast', requirePermission('Marketing', 'CREATE'), marketingController.dispatchSmsBlast);

export default router;
