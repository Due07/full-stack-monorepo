import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function SetupSwagger(app: INestApplication): void {
  const swaggerPath = 'docs';
  const config = new DocumentBuilder()
    .setTitle('Agent NestJS 后端接口文档')
    .setDescription('主登录系统 API 文档，包含认证、会话管理、管理员用户控制等接口')
    .setVersion('1.0.0')
    .addBearerAuth(undefined, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
