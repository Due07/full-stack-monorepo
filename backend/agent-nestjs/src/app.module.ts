import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpClientModule } from './clients/http-client/http-client.module';
import { AgentBotClientModule } from './common/ClientModules';
import { EnvConfigModule } from './common/ConfigModules';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { UsersModule } from './modules/users/users.module';
import { AgentBotModule } from './services/agent-bot/agent-bot.module';

@Module({
  imports: [
    EnvConfigModule(),
    PrismaModule,
    RedisModule,
    UsersModule,
    SessionsModule,
    SystemSettingsModule,
    AuditLogsModule,
    AuthModule,
    AdminUsersModule,
    AgentBotClientModule(),
    HttpClientModule,
    AgentBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
