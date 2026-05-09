export * from './auth';

export const ACTION_LABEL_MAP: Record<string, string> = {
  'auth.login.success': '登录成功',
  'auth.login.failed': '登录失败',
  'auth.refresh.failed': '刷新令牌失败',
  'auth.logout': '退出登录',
  'admin.user.status.updated': '更新用户状态',
  'admin.user.create': '创建账号',
  'admin.user.force.logout': '强制下线用户',
  'admin.user.force.logout.all': '强制下线全部会话',
  'admin.user.login.unfreeze': '解封登录账号',
};

export const ACTION_COLOR_MAP: Record<string, string> = {
  'auth.login.success': 'green',
  'auth.login.failed': 'red',
  'auth.refresh.failed': 'orange',
  'auth.logout': 'default',
  'admin.user.status.updated': 'blue',
  'admin.user.create': 'purple',
  'admin.user.force.logout': 'volcano',
  'admin.user.force.logout.all': 'volcano',
  'admin.user.login.unfreeze': 'cyan',
};

export function getActionLabel(action: string) {
  return ACTION_LABEL_MAP[action] || action;
}

export function getActionColor(action: string) {
  return ACTION_COLOR_MAP[action] || 'default';
}