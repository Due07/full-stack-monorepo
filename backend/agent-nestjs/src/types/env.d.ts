// 请勿手动修改，此文件由 */script/create-env-types.mjs* 生成
type TNodeEnv = 'development' | 'test' | 'production';

export type TEnv = {
  /** 当前运行环境：development | test | production */
  NODE_ENV: TNodeEnv;
  /** 服务监听主机地址；本地开发可用 127.0.0.1，容器部署建议 0.0.0.0 */
  HOST: string;
  /** 服务监听端口；本地默认可用 3000 */
  PORT: string;
  /** Chatwoot 服务基础地址（不带末尾斜杠），例如 http://127.0.0.1:3000 */
  CHATWOOT_BASE_URL: string;
  /** Agent Bot 的 API Access Token（从 Chatwoot Agent Bot 页面获取访问令牌） */
  CHATWOOT_BOT_API_ACCESS_TOKEN: string;
  /** 是否开启 Webhook 签名校验（MVP 阶段建议先关闭） */
  VERIFY_SIGNATURE: string;
  /** 微服务启动主机地址 */
  MICRO_HOST: string;
  /** 微服务监听端口 */
  MICRO_PORT: string;
  /** ======================================== Login System: PostgreSQL ======================================== 本地开发 PostgreSQL 连接串 */
  DATABASE_URL: string;
  /** ======================================== Login System: Redis ======================================== 本地开发 Redis 连接串（无密码） REDIS_URL="redis://127.0.0.1:6379" 本地开发 Redis 连接串（有密码） */
  REDIS_URL: string;
  /** ======================================== Login System: JWT / Auth ======================================== Access Token 签名密钥 */
  JWT_ACCESS_SECRET: string;
  /** Refresh Token 签名密钥 */
  JWT_REFRESH_SECRET: string;
  /** Access Token 过期时间 */
  JWT_ACCESS_EXPIRES_IN: string;
  /** Refresh Token 过期时间 */
  JWT_REFRESH_EXPIRES_IN: string;
  /** 注册时是否强制要求手机号 */
  AUTH_REGISTER_REQUIRE_PHONE: string;
  /** 连续登录失败达到多少次后冻结账号 */
  AUTH_LOGIN_FAIL_LIMIT: string;
  /** 登录账号冻结时长（小时） */
  AUTH_LOGIN_FREEZE_HOURS: string;
  /** 审计日志保留天数 */
  AUDIT_LOG_RETENTION_DAYS: string;
  /** 登录历史保留天数 */
  LOGIN_HISTORY_RETENTION_DAYS: string;
  /** 管理员强制下线后的默认前端提示文案 */
  ADMIN_FORCE_LOGOUT_MESSAGE: string;
  /** 初始化管理员默认用户名 */
  INIT_ADMIN_USERNAME: string;
  /** 初始化管理员默认密码 */
  INIT_ADMIN_PASSWORD: string;
  /** 可选的密码附加 Pepper */
  PASSWORD_PEPPER: string;
  /** ======================================== Login System: Swagger ======================================== 是否启用 Swagger 文档 */
  SWAGGER_ENABLE: string;
};
