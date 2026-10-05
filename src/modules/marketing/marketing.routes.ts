import { Router } from 'express';
import * as marketingController from './marketing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/social', marketingController.getSocialCredentials);
router.put('/social/:channel', requireRole(['ADMIN', 'MANAGER']), marketingController.updateSocialCredential);
router.post('/post', requireRole(['ADMIN', 'MANAGER', 'AGENT']), marketingController.createMarketingPost);

router.post('/blast', requireRole(['ADMIN', 'MANAGER', 'AGENT']), marketingController.dispatchSmsBlast);

export default router;
