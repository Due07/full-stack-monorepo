import { ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import PageCard from '@/components/PageCard';
import { DEFAULT_PAGE_SIZE, getActionColor, getActionLabel } from '@contants';
import { getAuditLogs } from '@/services/admin-users';
import type { AdminAuditLogItem } from '@/types/api';
import { formatDateTime, stringifyMetadata } from '@/utils/format';
import { getErrorMessage } from '@/utils/message';

export default function AuditLogsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadData = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const result = await getAuditLogs({ page: nextPage, pageSize: nextPageSize });
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
  }, []);

  const columns = useMemo<ColumnsType<AdminAuditLogItem>>(
    () => [
      { title: '动作', dataIndex: 'action', key: 'action', render: (value) => <Tag color={getActionColor(value)}>{getActionLabel(value)}</Tag> },
      { title: '用户 ID', dataIndex: 'userId', key: 'userId', render: (value) => value || '-' },
      { title: '用户名', dataIndex: 'username', key: 'username', render: (value) => value || '-' },
      { title: '操作人 ID', dataIndex: 'operatorUserId', key: 'operatorUserId', render: (value) => value || '-' },
      { title: '操作人', dataIndex: 'operatorUsername', key: 'operatorUsername', render: (value) => value || '-' },
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
            <span>{'审计日志'}</span>
            <Button type="link" size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData(page, pageSize)}>
              {'刷新'}
            </Button>
          </Space>
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
          scroll={{ x: 1400 }}
        />
      </PageCard>
    </>
  );
}
