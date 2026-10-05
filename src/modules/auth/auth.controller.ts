import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const data = await authService.login(email, password, ipAddress, userAgent);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: data.accessToken,
        user: data.user,
        permissions: [] // Dummy permissions for now
      }
    });
  } catch (error: any) {
    if (error.message === 'AUTH_INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }
    next(error);
  }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).user.sessionId;
    await authService.logout(sessionId);
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const user = await authService.getMe(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    return res.status(200).json({
      success: true,
      data: { user, permissions: [] }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } });
    }
    const data = await authService.refresh(refreshToken);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'AUTH_INVALID_TOKEN') {
      return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid refresh token' } });
    }
    next(error);
  }
};

export const changePasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Both passwords required' } });
    }
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.message === 'AUTH_INVALID_CREDENTIALS') {
      return res.status(400).json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Incorrect current password' } });
    }
    next(error);
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email required' } });
    }
    await authService.forgotPassword(email);
    // Always return success to prevent email enumeration
    return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Token and new password required' } });
    }
    await authService.resetPassword(token, newPassword);
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    if (error.message === 'AUTH_INVALID_TOKEN') {
      return res.status(400).json({ success: false, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
    next(error);
  }
};
