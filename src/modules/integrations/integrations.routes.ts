import { Router } from 'express';
import { 
  listIntegrationsHandler, 
  connectIntegrationHandler, 
  disconnectIntegrationHandler, 
  testIntegrationHandler 
} from './integrations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', listIntegrationsHandler);
router.post('/', connectIntegrationHandler); // Connect or Update
router.post('/:id/disconnect', disconnectIntegrationHandler);
router.post('/:id/test', testIntegrationHandler);

export default router;
