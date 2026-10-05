import { Router } from 'express';
import {
  getContactsListHandler,
  createContactHandler,
  updateContactHandler,
  deleteContactHandler,
  bulkCreateContactsHandler
} from './contacts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getContactsListHandler);
router.post('/', createContactHandler);
router.post('/bulk', bulkCreateContactsHandler);
router.put('/:id', updateContactHandler);
router.delete('/:id', deleteContactHandler);

export default router;
