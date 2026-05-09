import type { UserRole } from '@/types/api';

export function canViewAuditLogs(role?: UserRole | null) {
  return role === 'superAdmin';
}

export function canManageUser(currentRole?: UserRole | null, targetRole?: UserRole | null) {
  if (currentRole === 'superAdmin') {
    return true;
  }

  if (currentRole === 'admin') {
    return targetRole === 'user';
  }

  return false;
}

export function canAccessUserManagement(role?: UserRole | null) {
  return role === 'admin' || role === 'superAdmin';
}

export function canAccessProfileOnly(role?: UserRole | null) {
  return role === 'user';
}

export function canManageSystemSettings(role?: UserRole | null) {
  return role === 'admin' || role === 'superAdmin';
}
