import { AuditOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Row, Space, Switch, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { history } from 'umi';
import PageCard from '@/components/PageCard';
import RoleTag from '@/components/RoleTag';
import { getSystemSettings, updateSystemSetting } from '@/services/system-settings';
import { useAuthStore } from '@/stores/auth';
import type { SystemSettingItem } from '@/types/api';
import { canManageSystemSettings, canViewAuditLogs } from '@/utils/access';
import { getErrorMessage } from '@/utils/message';

const PUBLIC_USER_REGISTER_SETTING_KEY = 'public_user_register_enabled';

export default function DashboardPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const canManageSettings = canManageSystemSettings(currentUser?.role);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [registerSetting, setRegisterSetting] = useState<SystemSettingItem | null>(null);

  const isPublicRegisterEnabled = useMemo(() => registerSetting?.value === 'true', [registerSetting]);

  async function loadSystemSettings() {
    if (!canManageSettings) {
      return;
    }

    setSettingsLoading(true);
    try {
      const response = await getSystemSettings();
      const setting = response.items.find((item) => item.key === PUBLIC_USER_REGISTER_SETTING_KEY) ?? null;
      setRegisterSetting(setting);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleTogglePublicRegister(checked: boolean) {
    setSwitchLoading(true);
    try {
      const nextSetting = await updateSystemSetting(PUBLIC_USER_REGISTER_SETTING_KEY, checked);
      setRegisterSetting(nextSetting);
      message.success(checked ? '已开启用户端注册' : '已关闭用户端注册');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSwitchLoading(false);
    }
  }

  useEffect(() => {
    void loadSystemSettings();
  }, [canManageSettings]);

  return (
    <div className="flex flex-col gap-4">
      <PageCard title="工作台">
        <Space direction="vertical" size={12}>
          <Typography.Title level={4} className="!mb-0">
            欢迎回来，{currentUser?.displayName || currentUser?.username}
          </Typography.Title>
          {currentUser?.role && <RoleTag role={currentUser.role} />}
          <Typography.Text type="secondary">当前后台提供用户管理、登录历史、审计日志等能力。</Typography.Text>
        </Space>
      </PageCard>

      {canManageSettings && (
        <PageCard
          title={(
            <Space size={8}>
              <span>系统配置</span>
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                loading={settingsLoading}
                onClick={() => void loadSystemSettings()}
              >
                刷新
              </Button>
            </Space>
          )}
          loading={settingsLoading}
        >
          <div className="flex items-center justify-between gap-4">
            <Space direction="vertical" size={4}>
              <Typography.Text strong>开放用户端注册</Typography.Text>
              <Typography.Text type="secondary">
                控制用户端 H5 注册入口，影响接口 `/api/v1/auth/register`，默认关闭。
              </Typography.Text>
            </Space>
            <Switch
              checked={isPublicRegisterEnabled}
              loading={switchLoading}
              onChange={(checked) => void handleTogglePublicRegister(checked)}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </div>
        </PageCard>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card hoverable onClick={() => history.push('/profile')}>
            <Space>
              <UserOutlined />
              <span>查看我的信息</span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable onClick={() => history.push('/users')}>
            <Space>
              <TeamOutlined />
              <span>进入用户管理</span>
            </Space>
          </Card>
        </Col>
        {canViewAuditLogs(currentUser?.role) && (
          <Col xs={24} md={8}>
            <Card hoverable onClick={() => history.push('/audit-logs')}>
              <Space>
                <AuditOutlined />
                <span>查看审计日志</span>
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
