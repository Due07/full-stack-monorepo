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
- 用户端 H5 注册开关不再走环境变量，统一从 `system_settings.public_user_register_enabled` 读取，并由后台工作台控制。

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

## Prisma / 数据库命令说明

项目当前使用 Prisma 管理 PostgreSQL 表结构与类型生成，下面 4 个命令的职责要区分清楚：

- `pnpm db:migrate`
  - 实际执行：`prisma migrate dev`
  - 适用场景：本地开发阶段修改了 `prisma/schema.prisma`，需要生成新的 migration 并同步本地数据库。
  - 作用：
    - 生成新的迁移目录到 `prisma/migrations`
    - 将新迁移应用到当前本地数据库
    - 一般也会触发 Prisma Client 更新
  - 典型用法：
    - `pnpm db:migrate -- --name add_system_settings`

- `pnpm db:deploy`
  - 实际执行：`prisma migrate deploy`
  - 适用场景：测试环境、预发环境、生产环境，或者本地已经有现成 migration，只想把它们按顺序执行到数据库。
  - 作用：
    - 不生成新 migration
    - 只执行 `prisma/migrations` 目录中已有的迁移
  - 典型用途：
    - 新服务器新数据库初始化表结构
    - 老服务器拉取新代码后补齐新增字段/表

- `pnpm prisma:generate`
  - 实际执行：`prisma generate`
  - 适用场景：你改了 `schema.prisma` 后，TypeScript 提示 Prisma 类型不存在，例如：
    - `Module '"@prisma/client"' has no exported member 'SystemSetting'`
  - 作用：
    - 重新生成 Prisma Client
    - 更新 `@prisma/client` 中的 model 类型、枚举、查询 API
  - 注意：
    - 这个命令不改数据库表结构
    - 它只更新本地代码层的 Prisma 类型与客户端

- `pnpm prisma:studio`
  - 实际执行：`prisma studio`
  - 适用场景：想直接查看或编辑数据库里的数据。
  - 作用：
    - 启动 Prisma 自带的可视化数据面板
    - 可以直接查看表、记录、字段值

## 什么时候执行哪个命令

- **只报 Prisma 类型错误**
  - 先执行：`pnpm prisma:generate`

- **运行时报缺表 / 缺字段**
  - 执行：`pnpm db:deploy`

- **本地开发中刚修改了表结构**
  - 执行：
    1. `pnpm db:migrate -- --name your_migration_name`
    2. 如有必要，再执行 `pnpm prisma:generate`

- **新服务器首次部署**
  - 执行：
    1. `pnpm install`
    2. `pnpm db:deploy`
    3. `pnpm prisma:generate`
    4. 启动服务

- **老服务器更新版本后同步数据库**
  - 执行：
    1. 拉取最新代码
    2. `pnpm db:deploy`
    3. `pnpm prisma:generate`
    4. 重启服务

## 当前项目的推荐规则

- 开发阶段改表结构：优先使用 `pnpm db:migrate`
- 部署环境同步库结构：统一使用 `pnpm db:deploy`
- 看到 Prisma 类型缺失报错：先执行 `pnpm prisma:generate`
