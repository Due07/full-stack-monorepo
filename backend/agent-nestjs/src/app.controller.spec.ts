import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        // Provide a mock ClientProxy for AGENT_BOT_SERVICES token used in AppController
        {
          provide: 'AGENT_BOT_SERVICES',
          useValue: { send: jest.fn().mockReturnValue({ toPromise: () => Promise.resolve({}) }), emit: jest.fn() },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return health status', () => {
    const health = appController.GetHealth();
    expect(health.status).toBe('ok');
  });
});
