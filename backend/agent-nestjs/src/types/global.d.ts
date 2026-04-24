import type { TEnv } from './env';

declare global {
  type TGlobalEnv = TEnv;

  namespace NodeJS {
    interface ProcessEnv extends Partial<TEnv> { }
  }
}

export { };
