import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { history, useParams } from 'umi';
import PageCard from '@/components/PageCard';
import { forceLogoutUser, getAdminUserDetail, getAdminUserSessions } from '@/services/admin-users';
import type { AdminUserDetail, SessionItem } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/message';

export default function UserSessionsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userDetail, sessions] = await Promise.all([getAdminUserDetail(id), getAdminUserSessions(id)]);
      setUser(userDetail);
      setItems(sessions.items);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleForceLogout = async (sessionId: string) => {
    try {
      await forceLogoutUser(id, sessionId);
      messageApi.success('已强制下线该会话');
      await loadData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  const columns = useMemo<ColumnsType<SessionItem>>(
    () => [
      { title: '会话 ID', dataIndex: 'sessionId', key: 'sessionId', width: 260 },
      { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', render: (value) => value || '-' },
      { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', render: (value) => value || '-' },
      { title: 'IP', dataIndex: 'clientIp', key: 'clientIp', render: (value) => value || '-' },
      { title: 'User-Agent', dataIndex: 'userAgent', key: 'userAgent', ellipsis: true, render: (value) => value || '-' },
      { title: '最后活跃时间', dataIndex: 'lastActiveAt', key: 'lastActiveAt', render: (value) => formatDateTime(value) },
      { title: '过期时间', dataIndex: 'expiresAt', key: 'expiresAt', render: (value) => formatDateTime(value) },
      { title: '是否已失效', dataIndex: 'isRevoked', key: 'isRevoked', render: (value) => (value ? '是' : '否') },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Space>
            {!record.isRevoked && (
              <Button type="link" danger onClick={() => void handleForceLogout(record.sessionId)}>
                {'强制下线'}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {contextHolder}
      <PageCard
        loading={loading}
        title={
          <Space size={8}>
            <span>{`用户会话 - ${user?.displayName || user?.username || id}`}</span>
            <Button type="link" size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData()}>
              {'刷新'}
            </Button>
          </Space>
        }
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push(`/users/${id}`)}>
            {'返回详情'}
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          {'单登录规则下通常只会有一个有效会话，这里仍展示当前 / 历史记录。'}
        </Typography.Paragraph>
        <Table rowKey="sessionId" loading={loading} columns={columns} dataSource={items} pagination={false} scroll={{ x: 1400 }} />
      </PageCard>
    </>
  );
}
