import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/HttpException.filter';
import { ApiResponseInterceptor } from './common/interceptors/ApiResponse.interceptor';
import { SetupSwagger } from './common/swagger/Swagger';
import { RedisService } from './modules/redis/redis.service';

async function Bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
    ],
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  const configService = app.get(ConfigService<TGlobalEnv>);
  const redisService = app.get(RedisService);
  const port = +(configService.get('PORT') ?? 3000);
  const host = configService.get('HOST') ?? '0.0.0.0';
  const nodeEnv = configService.get('NODE_ENV') ?? 'development';
  const swaggerEnabled = (configService.get('SWAGGER_ENABLE') ?? 'true') === 'true';

  await redisService.Connect();

  if (swaggerEnabled) SetupSwagger(app);

  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port} (env: ${nodeEnv})`);

  if (swaggerEnabled) logger.log(`Swagger is running on: http://${host}:${port}/docs`);
}

Bootstrap();
