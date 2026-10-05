import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    
    if (!userRole) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Not authenticated' } });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden: Insufficient privileges' } });
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireManagerOrAbove = requireRole(['ADMIN', 'MANAGER']);
export const requireAgentOrAbove = requireRole(['ADMIN', 'MANAGER', 'AGENT']);

export const blockReadOnly = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  if (userRole === 'READ_ONLY') {
    return res.status(403).json({ success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden: Read-only users cannot perform this action' } });
  }
  next();
};
