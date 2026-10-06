export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'READ_ONLY';

export type PermissionAction = 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE';

export type PermissionMatrix = Record<string, Record<PermissionAction, boolean>>;

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  sessionId: string;
  permissions?: PermissionMatrix;
}
