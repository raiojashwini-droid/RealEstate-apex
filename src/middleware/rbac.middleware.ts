import { Request, Response, NextFunction } from 'express';
import { PermissionAction, UserRole } from '../types/auth';
import { normalizePermissions } from '../utils/permissions.util';

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

/**
 * Authoritative 4-action RBAC middleware.
 * Action must strictly be: 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE'
 */
export const requirePermission = (moduleName: string, action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.role) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // 1. ADMIN always has full administrative access
    if (user.role === 'ADMIN') {
      return next();
    }

    // 2. Resolve effective permissions
    const effectivePermissions = normalizePermissions(user.permissions, user.role as UserRole);

    const modulePerms = effectivePermissions[moduleName];
    if (modulePerms && modulePerms[action] === true) {
      return next();
    }

    // Unauthorized
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_FORBIDDEN',
        message: `Forbidden: You do not have permission to ${action.toLowerCase()} in ${moduleName}`
      }
    });
  };
};

