import { Button, Descriptions, Popconfirm, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import PageCard from '@/components/PageCard';
import RoleTag from '@/components/RoleTag';
import StatusTag from '@/components/StatusTag';
import { getCurrentUser, logout } from '@/services/auth';
import { getCurrentSessions, logoutAllSessions } from '@/services/sessions';
import { redirectToLogin } from '@/services/request';
import { useAuthStore } from '@/stores/auth';
import type { SessionItem } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/message';
import styles from './index.module.scss';

export default function ProfilePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const currentUser = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [session, setSession] = useState<SessionItem | null>(null);
  useEffect(() => {
    Promise.all([getCurrentUser(), getCurrentSessions()])
      .then(([user, sessions]) => {
        setCurrentUser(user);
        setSession(sessions.items.find((item) => !item.isRevoked) || sessions.items[0] || null);
      })
      .catch((error) => {
        messageApi.error(getErrorMessage(error));
      });
  }, [messageApi, setCurrentUser]);

  const handleLogout = async () => {
    try {
      if (session?.sessionId) {
        await logout(session.sessionId);
      } else {
        await logout();
      }
    } catch {
      // ignore
    } finally {
      clearSession();
      redirectToLogin();
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllSessions();
      clearSession();
      messageApi.success('已全部下线，请重新登录');
      redirectToLogin();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  const sessionItems = useMemo(
    () => [
      { key: 'deviceName', label: '设备名称', children: session?.deviceName || '-' },
      { key: 'deviceType', label: '设备类型', children: session?.deviceType || '-' },
      { key: 'clientIp', label: 'IP', children: session?.clientIp || '-' },
      { key: 'userAgent', label: 'User-Agent', children: session?.userAgent || '-' },
      { key: 'lastActiveAt', label: '最后活跃时间', children: formatDateTime(session?.lastActiveAt) },
      { key: 'expiresAt', label: '过期时间', children: formatDateTime(session?.expiresAt) },
      { key: 'isRevoked', label: '是否失效', children: session ? (session.isRevoked ? '是' : '否') : '-' },
    ],
    [session],
  );

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}
      <PageCard
        title="我的信息"
        extra={
          <Space>
            <Popconfirm title="确认退出登录？" onConfirm={handleLogout}>
              <Button>退出登录</Button>
            </Popconfirm>
            <Popconfirm title="确认让当前账号全部下线？" onConfirm={handleLogoutAll}>
              <Button danger>全部下线</Button>
            </Popconfirm>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{currentUser?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="外显名称">{currentUser?.displayName || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{currentUser?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{currentUser?.role ? <RoleTag role={currentUser.role} /> : '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">{currentUser?.status ? <StatusTag status={currentUser.status} /> : '-'}</Descriptions.Item>
        </Descriptions>
      </PageCard>

      <PageCard title="当前会话信息">
        <div className={styles.infoGrid}>
          {sessionItems.map((item) => (
            <div key={item.key} className={styles.infoItem}>
              <div className={styles.infoLabel}>{item.label}</div>
              <Typography.Text className={styles.infoValue}>{item.children}</Typography.Text>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
