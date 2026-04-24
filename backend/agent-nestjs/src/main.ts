import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function Bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService<TGlobalEnv>);
  const port = +(configService.get('PORT') ?? 3000);
  const host = configService.get('HOST') ?? '0.0.0.0';
  const nodeEnv = configService.get('NODE_ENV') ?? 'development';

  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port} (env: ${nodeEnv})`);
}

Bootstrap();
