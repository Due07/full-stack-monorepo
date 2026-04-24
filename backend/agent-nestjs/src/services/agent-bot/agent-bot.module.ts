import { Module } from '@nestjs/common';
import { AgentBotController } from './agent-bot.controller';
import { AgentBotService } from './agent-bot.service';
import { HttpClientModule } from '@/clients/http-client/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [AgentBotController],
  providers: [AgentBotService],
})
export class AgentBotModule { }
