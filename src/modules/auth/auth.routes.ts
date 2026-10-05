import { Router } from 'express';
import { 
  loginHandler, 
  logoutHandler, 
  getMeHandler,
  refreshHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', authMiddleware, logoutHandler);
router.post('/refresh', refreshHandler);
router.get('/me', authMiddleware, getMeHandler);

router.post('/change-password', authMiddleware, changePasswordHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;
