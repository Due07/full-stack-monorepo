import {
  AuditOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Result, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo } from 'react';
import { history, Link, Outlet, useLocation } from 'umi';
import { canAccessProfileOnly, canAccessUserManagement, canViewAuditLogs } from '@/utils/access';
import { getCurrentUser, logout } from '@/services/auth';
import { redirectToLogin } from '@/services/request';
import { useAuthStore } from '@/stores/auth';
import { ROLE_LABEL_MAP } from '@contants';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function buildMenu(role?: string | null): MenuItem[] {
  const items: MenuItem[] = [];

  if (role === 'admin' || role === 'superAdmin') {
    items.push({ key: '/', icon: <DashboardOutlined />, label: <Link to="/">工作台</Link> });
  }

  items.push({ key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">我的信息</Link> });

  if (canAccessUserManagement(role as never)) {
    items.push({ key: '/users', icon: <TeamOutlined />, label: <Link to="/users">用户管理</Link> });
  }

  if (canViewAuditLogs(role as never)) {
    items.push({ key: '/audit-logs', icon: <AuditOutlined />, label: <Link to="/audit-logs">审计日志</Link> });
  }

  return items;
}

export default function AdminLayout() {
  const location = useLocation();
  const hydrated = useAuthStore((state) => state.hydrated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken) {
      history.replace(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    if (!currentUser) {
      getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          redirectToLogin();
        });
    }
  }, [accessToken, currentUser, hydrated, location.pathname, location.search, setCurrentUser]);

  const menuItems = useMemo(() => buildMenu(currentUser?.role), [currentUser?.role]);

  const matchedKey = useMemo(() => {
    if (location.pathname.startsWith('/audit-logs')) {
      return '/audit-logs';
    }

    if (location.pathname.startsWith('/users')) {
      return '/users';
    }

    if (location.pathname.startsWith('/profile')) {
      return '/profile';
    }

    return '/';
  }, [location.pathname]);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        try {
          await logout();
        } catch {
          // ignore network error when logging out
        } finally {
          clearSession();
          history.replace('/login');
        }
      },
    },
  ];

  if (!hydrated || !accessToken || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const onlyProfile = canAccessProfileOnly(currentUser.role);
  const isAuditRoute = location.pathname.startsWith('/audit-logs');
  const isUserManagementRoute = location.pathname.startsWith('/users') || location.pathname === '/';

  if (onlyProfile && location.pathname !== '/profile') {
    return (
      <div className="page-container flex items-center justify-center p-6">
        <Result
          status="403"
          title="无权访问"
          subTitle="当前账号仅可访问个人信息页。"
          extra={<Button type="primary" onClick={() => history.push('/profile')}>前往我的信息</Button>}
        />
      </div>
    );
  }

  if (isAuditRoute && !canViewAuditLogs(currentUser.role)) {
    return (
      <div className="page-container flex items-center justify-center p-6">
        <Result
          status="403"
          title="无权访问"
          subTitle="只有超级管理员可以查看审计日志。"
          extra={<Button type="primary" onClick={() => history.push('/')}>返回首页</Button>}
        />
      </div>
    );
  }

  if (isUserManagementRoute && location.pathname !== '/profile' && !canAccessUserManagement(currentUser.role)) {
    return (
      <div className="page-container flex items-center justify-center p-6">
        <Result
          status="403"
          title="无权访问"
          subTitle="当前角色没有后台管理权限。"
          extra={<Button type="primary" onClick={() => history.push('/profile')}>返回我的信息</Button>}
        />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="h-16 flex items-center px-5 text-white text-lg font-semibold">Liberty 后台</div>
        <Menu theme="dark" mode="inline" selectedKeys={[matchedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between bg-white px-6 shadow-sm">
          <div>
            <Typography.Text type="secondary">当前角色：{ROLE_LABEL_MAP[currentUser.role]}</Typography.Text>
          </div>
          <Dropdown menu={{ items: dropdownItems }}>
            <Button type="text" className="h-auto px-2">
              <div className="flex items-center gap-3">
                <Avatar icon={<UserOutlined />} />
                <div className="text-left leading-5">
                  <div>{currentUser.displayName || currentUser.username}</div>
                  <div className="text-xs text-#8c8c8c">{currentUser.username}</div>
                </div>
              </div>
            </Button>
          </Dropdown>
        </Header>
        <Content className="page-container">
          <div className="page-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
