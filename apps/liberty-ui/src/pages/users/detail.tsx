import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Descriptions, Popconfirm, Space, message } from 'antd';
import { useEffect, useState } from 'react';
import { history, useParams } from 'umi';
import PageCard from '@/components/PageCard';
import RoleTag from '@/components/RoleTag';
import StatusTag from '@/components/StatusTag';
import { forceLogoutAllUserSessions, getAdminUserDetail, getAdminUserSessions, updateAdminUserStatus } from '@/services/admin-users';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/types/api';
import type { AdminUserDetail, SessionItem, UserStatus } from '@/types/api';
import { canManageUser } from '@/utils/access';
import { formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/message';

export default function UserDetailPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const { id = '' } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, sessions] = await Promise.all([getAdminUserDetail(id), getAdminUserSessions(id)]);
      setDetail(user);
      setActiveSession(sessions.items.find((item) => !item.isRevoked) || null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 403) {
        history.replace('/403');
        return;
      }

      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const manageable = canManageUser(currentUser?.role, detail?.role);

  const handleStatusToggle = async (status: UserStatus) => {
    try {
      await updateAdminUserStatus(id, {
        status,
        reason: status === 'disabled' ? '后台手动禁用' : '后台手动启用',
      });
      messageApi.success(status === 'disabled' ? '已禁用用户' : '已启用用户');
      await loadData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  const handleForceLogout = async () => {
    try {
      await forceLogoutAllUserSessions(id);
      messageApi.success('已强制下线该用户');
      await loadData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}
      <PageCard
        loading={loading}
        title={
          <Space size={8}>
            <span>{'用户详情'}</span>
            <Button type="link" size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData()}>
              {'刷新'}
            </Button>
          </Space>
        }
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/users')}>
              {'返回列表'}
            </Button>
            <Button onClick={() => history.push(`/users/${id}/sessions`)}>{'查看会话'}</Button>
            <Button onClick={() => history.push(`/users/${id}/login-history`)}>{'查看登录历史'}</Button>
            {manageable && activeSession && !activeSession.isRevoked && (
              <Popconfirm title={'确认强制下线该用户？'} onConfirm={() => void handleForceLogout()}>
                <Button danger>{'强制下线'}</Button>
              </Popconfirm>
            )}
            {manageable && detail?.status === 'active' && (
              <Popconfirm title={'确认禁用该用户？'} onConfirm={() => void handleStatusToggle('disabled')}>
                <Button danger>{'禁用'}</Button>
              </Popconfirm>
            )}
            {manageable && detail?.status === 'disabled' && (
              <Popconfirm title={'确认启用该用户？'} onConfirm={() => void handleStatusToggle('active')}>
                <Button type="primary">{'启用'}</Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={'用户 ID'}>{detail?.id || '-'}</Descriptions.Item>
          <Descriptions.Item label={'用户名'}>{detail?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label={'外显名称'}>{detail?.displayName || '-'}</Descriptions.Item>
          <Descriptions.Item label={'手机号'}>{detail?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label={'角色'}>{detail?.role ? <RoleTag role={detail.role} /> : '-'}</Descriptions.Item>
          <Descriptions.Item label={'状态'}>{detail?.status ? <StatusTag status={detail.status} /> : '-'}</Descriptions.Item>
          <Descriptions.Item label={'最近登录时间'}>{formatDateTime(detail?.lastLoginAt)}</Descriptions.Item>
          <Descriptions.Item label={'当前是否在线'}>{activeSession && !activeSession.isRevoked ? '是' : '否'}</Descriptions.Item>
        </Descriptions>
      </PageCard>
    </div>
  );
}
