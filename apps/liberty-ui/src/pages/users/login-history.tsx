import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { history, useParams } from 'umi';
import PageCard from '@/components/PageCard';
import { DEFAULT_PAGE_SIZE, getActionColor, getActionLabel } from '@contants';
import { getAdminUserDetail, getAdminUserLoginHistory } from '@/services/admin-users';
import type { AdminAuditLogItem, AdminUserDetail } from '@/types/api';
import { formatDateTime, stringifyMetadata } from '@/utils/format';
import { getErrorMessage } from '@/utils/message';

export default function UserLoginHistoryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadData = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const [userDetail, result] = await Promise.all([
        getAdminUserDetail(id),
        getAdminUserLoginHistory(id, { page: nextPage, pageSize: nextPageSize }),
      ]);
      setUser(userDetail);
      setItems(result.items);
      setPage(result.page);
      setPageSize(result.pageSize);
      setTotal(result.total);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1, DEFAULT_PAGE_SIZE);
  }, [id]);

  const columns = useMemo<ColumnsType<AdminAuditLogItem>>(
    () => [
      { title: '动作', dataIndex: 'action', key: 'action', render: (value) => <Tag color={getActionColor(value)}>{getActionLabel(value)}</Tag> },
      { title: '用户名', dataIndex: 'username', key: 'username', render: (value) => value || '-' },
      { title: '操作人用户名', dataIndex: 'operatorUsername', key: 'operatorUsername', render: (value) => value || '-' },
      {
        title: '元数据',
        dataIndex: 'metadata',
        key: 'metadata',
        render: (value) => <Typography.Paragraph className="json-pretty" copyable>{stringifyMetadata(value)}</Typography.Paragraph>,
      },
      { title: '时间', dataIndex: 'createdAt', key: 'createdAt', render: (value) => formatDateTime(value) },
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
            <span>{`登录历史 - ${user?.displayName || user?.username || id}`}</span>
            <Button type="link" size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData(page, pageSize)}>
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
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              void loadData(nextPage, nextPageSize);
            },
          }}
        />
      </PageCard>
    </>
  );
}
