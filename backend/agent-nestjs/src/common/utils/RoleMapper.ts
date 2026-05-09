import { UserRole } from '@prisma/client';

export type TApiUserRole = 'user' | 'admin' | 'superAdmin';

export function ToApiUserRole(role: UserRole): TApiUserRole {
  switch (role) {
    case UserRole.super_admin:
      return 'superAdmin';
    case UserRole.admin:
      return 'admin';
    default:
      return 'user';
  }
}
