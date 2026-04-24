import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, ClientsModuleAsyncOptions, Transport } from '@nestjs/microservices';

const CLIENTS_OPTIONS: ClientsModuleAsyncOptions = [
  {
    // 处理agent-webhook 发送过来消息服务
    name: 'AGENT_BOT_SERVICES',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<TGlobalEnv>) => ({
      transport: Transport.TCP,
      options: {
        port: +(configService.get('MICRO_PORT') ?? 3001),
        host: configService.get('MICRO_HOST'),
      }
    }),
  }
];

export const AgentBotClientModule = () => {
  return ClientsModule.registerAsync(CLIENTS_OPTIONS);
};
