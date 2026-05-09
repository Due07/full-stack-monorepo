import { Tag } from 'antd';
import { ROLE_LABEL_MAP } from '@contants';
import type { UserRole } from '@/types/api';

const ROLE_COLOR_MAP: Record<UserRole, string> = {
  superAdmin: 'red',
  admin: 'blue',
  user: 'default',
};

export default function RoleTag({ role }: { role: UserRole }) {
  return <Tag color={ROLE_COLOR_MAP[role]}>{ROLE_LABEL_MAP[role]}</Tag>;
}
