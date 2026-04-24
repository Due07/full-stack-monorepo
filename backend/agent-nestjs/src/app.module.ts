import { Module } from '@nestjs/common';
// import { HttpModule } from '@nestjs/axios';
import { AppService } from './app.service';
import { AgentBotModule } from './services/agent-bot/agent-bot.module';
import { HttpClientModule } from './clients/http-client/http-client.module';
import { AppController } from './app.controller';
import { EnvConfigModule } from './common/ConfigModules';
import { AgentBotClientModule } from './common/ClientModules';

@Module({
  imports: [
    EnvConfigModule(),
    AgentBotClientModule(),
    // HttpModule,
    HttpClientModule,
    AgentBotModule,
  ],
  // controllers 负责定义路由入口，接收请求并把处理委托给 service。
  controllers: [AppController],
  // providers 负责注册可注入依赖（如 service/client），供 DI 容器统一管理与复用。
  // providers: [AppService, HttpClientService, AgentBotService],
  providers: [AppService],
})
export class AppModule { }
