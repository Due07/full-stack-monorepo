import { Tag } from 'antd';
import { STATUS_LABEL_MAP } from '@contants';
import type { UserStatus } from '@/types/api';

const STATUS_COLOR_MAP: Record<UserStatus, string> = {
  active: 'green',
  disabled: 'red',
};

export default function StatusTag({ status }: { status: UserStatus }) {
  return <Tag color={STATUS_COLOR_MAP[status]}>{STATUS_LABEL_MAP[status]}</Tag>;
}
