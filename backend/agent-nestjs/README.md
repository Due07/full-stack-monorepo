# nestjs-agent-api

NestJS + TypeScript(strict) 基础项目。

## 快速开始

```bash
pnpm install
pnpm start:dev
```

先复制环境变量模板：
- PowerShell: `Copy-Item .env.example .env`
- macOS/Linux: `cp .env.example .env`

服务默认端口：`3000`（可通过 `.env` 中的 `PORT` 覆盖）

健康检查：`GET /health`

## 环境变量

项目通过 `@nestjs/config` 加载 `.env`。

- `PORT`: 服务启动端口。
- `NODE_ENV`: 运行环境，使用 `development`、`test`、`production`。
- `HOST`: 服务监听地址（如 `127.0.0.1` 或 `0.0.0.0`）。
- `CHATWOOT_BASE_URL`: Chatwoot 基础地址；`HttpClientService` 可使用它拼接相对路径。
- `CHATWOOT_BOT_API_ACCESS_TOKEN`: Agent Bot API Token。
- `BOT_REPLY_TEXT`: 默认回复文本。
- `VERIFY_SIGNATURE`: 是否启用 webhook 签名校验（MVP 默认关闭）。

## 目录结构（精简）

```text
src/
├─ clients/                 # 对外请求客户端逻辑（如 Chatwoot/第三方 API 调用）
│  └─ http-client/          # HTTP 客户端功能目录
│     └─ http-client.service.ts
├─ services/                # 对内服务逻辑（业务编排、领域服务）
├─ common/                  # 公共方法与通用能力
├─ decorators/              # 自定义装饰器
├─ app.controller.ts        # 应用入口控制器（如健康检查）
├─ app.service.ts           # 应用级基础服务
├─ app.module.ts            # 根模块，聚合全局依赖与 Provider
└─ main.ts                  # 启动入口（读取环境并监听 HOST/PORT）
```

## NestJS 分层说明

- `controller`：接口层，负责定义路由、接收请求参数、返回响应；不放复杂业务。
- `service`：业务层，负责事件判断、业务流程编排、调用客户端或其他服务。
- `module`：装配层，负责注册 `controllers/providers`、声明依赖 `imports`、对外暴露 `exports`。

当前项目示例：
- `src/services/chatwoot-agent-bot/chatwoot-agent-bot.controller.ts`：Webhook 路由入口。
- `src/services/chatwoot-agent-bot/chatwoot-agent-bot.service.ts`：消息过滤、去重、回写 Chatwoot。
- `src/app.module.ts`：根模块，聚合并注册应用需要的控制器与服务。

## 常用命令

```bash
pnpm build
pnpm start:development
pnpm start:test
pnpm start:production
pnpm lint
pnpm test
pnpm test:e2e
```
