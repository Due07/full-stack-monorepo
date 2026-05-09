import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService<TGlobalEnv>) {
    const redisUrl = this.configService.get('REDIS_URL');

    this.client = redisUrl
      ? new Redis(redisUrl, { lazyConnect: true })
      : new Redis({ lazyConnect: true });
  }

  public GetClient(): Redis {
    return this.client;
  }

  public async Connect(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }

  public SetKey(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    if (!ttlSeconds) {
      return this.client.set(key, value);
    }

    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  public GetKey(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public IncrementKey(key: string): Promise<number> {
    return this.client.incr(key);
  }

  public ExpireKey(key: string, ttlSeconds: number): Promise<number> {
    return this.client.expire(key, ttlSeconds);
  }

  public GetTtl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  public DeleteKey(key: string): Promise<number> {
    return this.client.del(key);
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
