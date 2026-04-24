import { Body, Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AgentBotService } from './agent-bot.service';

@Controller('agent-bot')
export class AgentBotController {
  private readonly logger = new Logger(AgentBotController.name);

  constructor(private readonly agentBotService: AgentBotService) { }

  @Post('webhook')
  public async receiveWebhook(
    @Body() payload: unknown,
    @Req() req: Request,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ): Promise<{ status: string }> {
    const sourceIp = this.ResolveSourceIp(req, forwardedFor);
    this.logger.log(`Received agent bot webhook event sourceIp=${sourceIp}`);

    await this.agentBotService.HandleWebhook(payload);
    return { status: 'ok' };
  }

  private ResolveSourceIp(req: Request, forwardedFor?: string): string {
    if (forwardedFor) {
      const firstForwardedIp = forwardedFor.split(',')[0]?.trim();
      if (firstForwardedIp) {
        return firstForwardedIp;
      }
    }

    const socketIp = req.socket?.remoteAddress;
    return socketIp ?? 'unknown';
  }
}
