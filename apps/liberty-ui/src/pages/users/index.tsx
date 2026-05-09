import { PlusOutlined, ReloadOutlined, UnlockOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { history } from 'umi';
import { CreateRandomStr } from '@utils/random';
import PageCard from '@/components/PageCard';
import RoleTag from '@/components/RoleTag';
import StatusTag from '@/components/StatusTag';
import { DEFAULT_PAGE_SIZE } from '@contants';
import { createAdminUser, getAdminUsers, unfreezeLoginAccount, updateAdminUserStatus } from '@/services/admin-users';
import { useAuthStore } from '@/stores/auth';
import type { AdminUserItem, UserStatus } from '@/types/api';
import { canManageUser } from '@/utils/access';
import { getErrorMessage } from '@/utils/message';
import styles from './index.module.scss';

type UnfreezeFormValues = {
  account: string;
  reason?: string;
};

type CreateUserFormValues = {
  username: string;
  displayName?: string;
  phone?: string;
  password: string;
  role: 'user' | 'admin';
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;
const PASSWORD_RULE_MESSAGE = '密码格式不正确（大小写字母+数字）至少8位';

export default function UsersPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<UnfreezeFormValues>();
  const [createForm] = Form.useForm<CreateUserFormValues>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadData = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const result = await getAdminUsers({ page: nextPage, pageSize: nextPageSize });
      setItems(result.items);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1, DEFAULT_PAGE_SIZE);
  }, []);

  const handleStatusToggle = async (record: AdminUserItem, status: UserStatus) => {
    try {
      await updateAdminUserStatus(record.id, {
        status,
        reason: status === 'disabled' ? '后台手动禁用' : '后台手动启用',
      });
      messageApi.success(status === 'disabled' ? '已禁用用户' : '已启用用户');
      await loadData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  const columns = useMemo<ColumnsType<AdminUserItem>>(
    () => [
      { title: '用户名', dataIndex: 'username', key: 'username' },
      { title: '外显名称', dataIndex: 'displayName', key: 'displayName', render: (value) => value || '-' },
      { title: '手机号', dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
      { title: '角色', dataIndex: 'role', key: 'role', render: (value) => <RoleTag role={value} /> },
      { title: '状态', dataIndex: 'status', key: 'status', render: (value) => <StatusTag status={value} /> },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => {
          const manageable = canManageUser(currentUser?.role, record.role);

          return (
            <Space wrap>
              <Button type="link" onClick={() => history.push(`/users/${record.id}`)}>
                查看详情
              </Button>
              {manageable && record.status === 'active' && (
                <Popconfirm
                  title={
                    <span>
                      确认禁用 <strong>{record.username || record.phone || '-'}</strong> 用户吗？
                    </span>
                  }
                  onConfirm={() => void handleStatusToggle(record, 'disabled')}
                >
                  <Button type="link" danger>
                    禁用
                  </Button>
                </Popconfirm>
              )}
              {manageable && record.status === 'disabled' && (
                <Popconfirm title="确认启用该用户？" onConfirm={() => void handleStatusToggle(record, 'active')}>
                  <Button type="link">启用</Button>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    [currentUser?.role],
  );

  const handleUnfreeze = async () => {
    const values = await form.validateFields();
    setModalSubmitting(true);
    try {
      await unfreezeLoginAccount(values);
      messageApi.success('账号已解封');
      setModalOpen(false);
      form.resetFields();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    const values = await createForm.validateFields();
    setCreateSubmitting(true);
    try {
      await createAdminUser({
        username: values.username,
        displayName: values.displayName,
        phone: values.phone,
        password: values.password,
        role: values.role,
      });
      messageApi.success('账号创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      await loadData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const roleOptions = currentUser?.role === 'superAdmin'
    ? [
      { label: '普通用户', value: 'user' },
      { label: '管理员', value: 'admin' },
    ]
    : [{ label: '普通用户', value: 'user' }];

  const handleGeneratePassword = () => {
    createForm.setFieldValue('password', CreateRandomStr(8));
  };

  return (
    <>
      {contextHolder}
      <PageCard
        title={
          <Space size={8}>
            <span>用户管理</span>
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadData(page, pageSize)}
            >
              刷新
            </Button>
          </Space>
        }
        extra={
          <div className={styles.toolbar}>
            <Typography.Text type="secondary">列表按 page / pageSize 分页，默认每页 10 条。</Typography.Text>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                创建账号
              </Button>
              <Button icon={<UnlockOutlined />} onClick={() => setModalOpen(true)}>
                解封账号
              </Button>
            </Space>
          </div>
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

      <Modal
        title="创建账号"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => void handleCreateUser()}
        confirmLoading={createSubmitting}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" initialValues={{ role: 'user' }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="外显名称" name="displayName">
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { pattern: PASSWORD_RULE, message: PASSWORD_RULE_MESSAGE },
            ]}
          >
            <Input.Password
              addonAfter={
                <Button type="link" size="small" onClick={handleGeneratePassword}>
                  随机密码
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="手动解封登录账号"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleUnfreeze()}
        confirmLoading={modalSubmitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="account" name="account" rules={[{ required: true, message: '请输入需要解封的 account' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="reason" name="reason">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}