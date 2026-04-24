import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { AgentBotController } from './agent-bot.controller';
import { AgentBotService } from './agent-bot.service';

describe('AgentBotController', () => {
  let controller: AgentBotController;
  const agentBotServiceMock = {
    HandleWebhook: jest.fn<Promise<void>, [unknown]>(),
  };

  beforeEach(async () => {
    agentBotServiceMock.HandleWebhook.mockReset();
    agentBotServiceMock.HandleWebhook.mockResolvedValue(undefined);

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AgentBotController],
      providers: [
        {
          provide: AgentBotService,
          useValue: agentBotServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get<AgentBotController>(AgentBotController);
  });

  it('should call service and return ok status', async () => {
    const payload = { event: 'message_created', message_type: 'incoming' };
    const mockReq = { socket: { remoteAddress: '1.2.3.4' } } as unknown as Request;
    const result = await controller.receiveWebhook(payload, mockReq);

    expect(agentBotServiceMock.HandleWebhook).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ status: 'ok' });
  });
});
