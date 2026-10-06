import { Router } from 'express';
import {
  getContactsListHandler,
  createContactHandler,
  updateContactHandler,
  deleteContactHandler,
  bulkCreateContactsHandler
} from './contacts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('Contacts Directory', 'VIEW'), getContactsListHandler);
router.post('/', requirePermission('Contacts Directory', 'CREATE'), createContactHandler);
router.post('/bulk', requirePermission('Contacts Directory', 'CREATE'), bulkCreateContactsHandler);
router.put('/:id', requirePermission('Contacts Directory', 'EDIT'), updateContactHandler);
router.delete('/:id', requirePermission('Contacts Directory', 'DELETE'), deleteContactHandler);

export default router;
