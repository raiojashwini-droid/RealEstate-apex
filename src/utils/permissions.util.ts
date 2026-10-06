import { PermissionAction, PermissionMatrix, UserRole } from '../types/auth';

export const ALL_MODULES = [
  'Dashboard',
  'Outreach Pipeline',
  'AI Deals & Offers',
  'Conversations',
  'Task Manager',
  'Contacts Directory',
  'Marketing',
  'Templates & Automations',
  'Reports & Audit',
  'Settings'
] as const;

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  ADMIN: {
    'Dashboard': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Outreach Pipeline': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'AI Deals & Offers': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Conversations': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Task Manager': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Contacts Directory': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Marketing': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Templates & Automations': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Reports & Audit': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Settings': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
  },
  MANAGER: {
    'Dashboard': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Outreach Pipeline': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'AI Deals & Offers': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Conversations': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Task Manager': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Contacts Directory': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Marketing': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'Templates & Automations': { CREATE: true, VIEW: true, EDIT: true, DELETE: true },
    'Reports & Audit': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Settings': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
  },
  AGENT: {
    'Dashboard': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Outreach Pipeline': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'AI Deals & Offers': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'Conversations': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'Task Manager': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'Contacts Directory': { CREATE: true, VIEW: true, EDIT: true, DELETE: false },
    'Marketing': { CREATE: false, VIEW: false, EDIT: false, DELETE: false },
    'Templates & Automations': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Reports & Audit': { CREATE: false, VIEW: false, EDIT: false, DELETE: false },
    'Settings': { CREATE: false, VIEW: false, EDIT: false, DELETE: false },
  },
  READ_ONLY: {
    'Dashboard': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Outreach Pipeline': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'AI Deals & Offers': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Conversations': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Task Manager': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Contacts Directory': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Marketing': { CREATE: false, VIEW: false, EDIT: false, DELETE: false },
    'Templates & Automations': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Reports & Audit': { CREATE: false, VIEW: true, EDIT: false, DELETE: false },
    'Settings': { CREATE: false, VIEW: false, EDIT: false, DELETE: false },
  }
};

/**
 * Normalizes any legacy or arbitrary permission object into the canonical 4-action schema.
 */
export function normalizePermissions(raw: any, role: UserRole = 'AGENT'): PermissionMatrix {
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.AGENT;
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(defaults));
  }

  const normalized: PermissionMatrix = {};

  for (const moduleName of ALL_MODULES) {
    const rawModule = raw[moduleName] || {};
    const defaultModule = defaults[moduleName] || { CREATE: false, VIEW: false, EDIT: false, DELETE: false };

    // Canonical action resolutions with backward-compatibility for legacy keys:
    // CREATE: raw.CREATE ?? raw.Create
    // VIEW: raw.VIEW ?? raw.View ?? raw.Show
    // EDIT: raw.EDIT ?? raw.Edit
    // DELETE: raw.DELETE ?? raw.Delete
    const createVal = rawModule.CREATE ?? rawModule.Create ?? defaultModule.CREATE;
    const viewVal = rawModule.VIEW ?? rawModule.View ?? rawModule.Show ?? defaultModule.VIEW;
    const editVal = rawModule.EDIT ?? rawModule.Edit ?? defaultModule.EDIT;
    const deleteVal = rawModule.DELETE ?? rawModule.Delete ?? defaultModule.DELETE;

    normalized[moduleName] = {
      CREATE: Boolean(createVal),
      VIEW: Boolean(viewVal),
      EDIT: Boolean(editVal),
      DELETE: Boolean(deleteVal),
    };
  }

  return normalized;
}
