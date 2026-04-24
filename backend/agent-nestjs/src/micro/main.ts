import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { GetEnvCfgFn } from '@/common/config/Env';

async function Bootstrap(): Promise<void> {
  const { PORT: port, HOST: host, NODE_ENV } = GetEnvCfgFn();

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { host, port },
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const logger = new Logger('MicroService Bootstrap');
  await app.listen();
  logger.log(`Microservice is running on tcp://${host}:${port} (env: ${NODE_ENV})`);
}

Bootstrap();
