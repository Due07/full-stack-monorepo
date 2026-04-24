import { configDotenv } from 'dotenv';

/**
 * override: true 优先使用 .env 文件中的变量，覆盖系统环境变量（如果有冲突）
 */
configDotenv({ path: '.env', override: true });
/**
 * 获取环境变量配置
 * @returns 返回一个冻结的环境变量对象，确保其不可修改
 */
export const GetEnvCfgFn = () => {
  const { env } = process;
  return Object.freeze({ ...env });
};

/**
 * 获取环境变量配置的简化版本，直接通过 get 方法获取指定键的值
 */
export const GetEnvCfg = Object.freeze({
  get(key: keyof TGlobalEnv) {
    const { env } = process;
    return env[key];
  }
});
