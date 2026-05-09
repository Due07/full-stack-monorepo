# liberty-ui 联调说明

## 环境变量

- `UMI_APP_API_BASE_URL`：前端请求基地址，默认值建议为 `/api`
- `UMI_APP_API_PROXY_TARGET`：本地开发代理目标，默认指向 `http://127.0.0.1:3000`

## 本地开发

```bash
pnpm --dir apps/liberty-ui dev
```

默认访问：`http://127.0.0.1:8001`

## 构建

```bash
pnpm --dir apps/liberty-ui build
```

## 对接规则

- 成功返回：`{ code, msg, data }`
- 失败返回：`{ code, msg, data }`
- `accessToken` 自动通过 `Authorization: Bearer <token>` 携带
- `refreshToken` 自动通过请求头 `x-refresh-token` 传递
- refresh 失败后自动清空登录态并跳转 `/login`

## 已实现页面

- `/login`
- `/`
- `/profile`
- `/users`
- `/users/:id`
- `/users/:id/sessions`
- `/users/:id/login-history`
- `/audit-logs`
- `/403`
- `/404`

## 角色规则

- `super_admin`：全部页面可访问
- `admin`：可访问用户管理相关页面，不可访问审计日志
- `user`：仅允许访问 `/profile`
