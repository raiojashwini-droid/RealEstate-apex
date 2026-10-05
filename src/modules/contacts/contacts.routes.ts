import { Router } from 'express';
import {
  getContactsListHandler,
  createContactHandler,
  updateContactHandler,
  deleteContactHandler,
  bulkCreateContactsHandler,
  bulkDeleteContactsHandler
} from './contacts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getContactsListHandler);
router.post('/', createContactHandler);
router.post('/bulk', bulkCreateContactsHandler);
router.post('/bulk-delete', bulkDeleteContactsHandler);
router.delete('/bulk', bulkDeleteContactsHandler);
router.put('/:id', updateContactHandler);
router.delete('/:id', deleteContactHandler);

export default router;
