import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import prisma from '../prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized access' } });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized access' } });
    }
    const payload = verifyAccessToken(token);

    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.revokedAt) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Session expired or revoked' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Account is deactivated' } });
    }

    // Attach user payload to request
    (req as any).user = { id: user.id, role: user.role, sessionId: session.id };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid token' } });
  }
};
