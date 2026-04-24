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
  /** Agent Bot 的 API Access Token（从 Chatwoot Agent Bot 页面获取 访问令牌） */
  CHATWOOT_BOT_API_ACCESS_TOKEN: string;
  /** 是否开启 Webhook 签名校验（MVP 建议先 false） */
  VERIFY_SIGNATURE: string;
  /** 微服务启动主机地址 */
  MICRO_HOST: string;
  /** 微服务监听端口 */
  MICRO_PORT: string;
};
