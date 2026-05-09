# Development Guidelines

## 基础架构

- **技术架构**:
  - 项目基础： **nestjs**  - 优先使用 nestjs 集成服务管理器，其次推荐优秀管理器，并提出与nestjs集成的差比对比 供维护者选择
  - 开发语言： **typescript** - 必须使用严格模式！
  - 发送器：使用兼容nestjs的**axios**
  - 格式规范： 使用 **eslint**
  - 测试单元：优先使用 **nestjs**集成的管理器，其次推荐优秀管理器，并提出与nestjs集成的差比对比 供维护者选择
  - log日志： 优先使用**nestjs** 提供日志服务，其次选择需要告诉维护者 推荐使用xxx， 并说明原因
  - 管理器使用： 优先使用 pnpm —> yarn -> npm
  - 模块指令：优先使用 `nest`指令 进行生成模块文件夹！
    - `nest g co ${xxx}` --- 生成控制器
    - `nest g mo ${xxx}` --- 生成模块
    - `nest g s ${xxx}` --- 生成服务
    - `nest g resource ${xxx}` --- 生成完整CRUD结构（controller、module、services、entity、dto）
    - 通知！：`${xxx}` 指定目录下/文件名称，例：`nest g co services/user`, services目录下，user文件

## Skills

- 每次对话时，应该优先是否有符合当前任务 **skill**， 有则回复按照 xxx  skill 进行处理

## Styling

- 所有的.ts 文件 原则上， 每一行不得超过 **150行**
- ts类型中，定义 `type` 需要使用`T`为前缀，如: `type TClient = string`, 定义 `interface` 需要以 `I` 为前缀， 如：`interface IClient {}`
- 导出的 **函数 / 变量 / 类** 必须遵循 **PascalCase** 规则
- 文件内的 **函数 / 变量** 必须遵循 **camelCase** 规则
- 常量则必须遵循 **CONSTANT_CASE** 规则
- 所有的 **class** 必须遵循 **PascalCase** 规则
- **class** 继承不可 >= 3 层， 可以抽离使用 **IOC / DI** or **Strategy Pattern** 模式 or  **Decorator Pattern**！
- 每次修改涉及流程变动时，需要同步更新对应 **specs.ts文件**，同时已经单元测试 ！
- 面向对外接口前缀 `/api`, 如：后台接口则是 `/api/admin/xxxx`， 面向用户H5 的则是 `/api/v1/xxxx`, 面向用户默认是 v1 版本

## 功能目录划分
- 所有开发的功能应该放在 `/src` 下, 可以使用 `nest g` 来进行创建文件夹结构，以保证统一且简洁
- 功能划分应一个完整功能为一个文件夹，其中文件夹应该包含`主文件.ts`和 `对应的测试单元（.spec.ts）`！！
- `/src/services`目录存放对内服务逻辑，`/src/clients`目录存放对方请求服务的业务逻辑
- `/src/decorators` 存放公共 自己写的装饰器，按照 `一个抽象逻辑`一个文件原则
- `/src/common` 存放公共方法，按照`一个抽象逻辑` 一个方法为原则

## General Guidelines

- MVP focus: Least code change, happy-path only
- No unnecessary defensive programming
- Prefer minimal, readable code over elaborate abstractions; clarity beats cleverness
- Break down complex tasks into small, testable units
- Iterate after confirmation
- Avoid writing specs unless explicitly asked
- Remove dead/unreachable/unused code
- Don’t write multiple versions or backups for the same logic — pick the best approach and implement it
- Prefer `with_modified_env` (from spec helpers) over stubbing `ENV` directly in specs
- 当接受到指令时，你对于要执行的指令认为不清晰 or 不明确时，你可以向我进一步咨询来进行完善信息、或者协助你无法执行的操作等
- 当要执行**任务块**时，请先明确的列出你的计划，得到进一步确认时则执行你的计划
- 必要时可以在一些位置上一些**（简介、点明主题）**注释 