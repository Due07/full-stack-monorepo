import { Logger } from '@nestjs/common';

export function InitLogger(): PropertyDecorator;
export function InitLogger(keyName: string): PropertyDecorator;
export function InitLogger(target?: object, key?: string | symbol): void;

export function InitLogger(target?: object | string, key?: string | symbol): void | PropertyDecorator {
  const fn = (ctx: object, key: string | symbol, prefix?: string) => {
    const logger = new Logger(prefix ?? ctx.constructor.name);
    Reflect.set(ctx, key, logger);
  };
  if (typeof target === 'object') return fn(target, key!);

  return (ctx, key) => fn(ctx, key, target);
};

export type TLogType = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * @param msg 日志内容，支持字符串或字符串数组 or Logger 内置其他参数
 * @param logType 打印类型，默认为 'log'
 * @param logger 打印工具，默认为 NestJS 内置 Logger
 * @returns 
 */
export const LogFn = (msg: any[] | string, logType: TLogType = 'log', logger?: Logger): MethodDecorator => {
  const msgArr = Array.isArray(msg) ? msg : [msg];
  const fn: (...args: any[]) => void = logger ? logger[logType].bind(logger) : Logger[logType];

  fn(...msgArr);
  return () => { };
};
