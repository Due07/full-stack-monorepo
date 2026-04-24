import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('AGENT_BOT_SERVICES') private readonly client: ClientProxy,
  ) { }

  @Get('health')
  public GetHealth(): { status: string; timestamp: string } {
    return this.appService.GetHealth();
  }

  @Get('micro')
  public async GetMicro(@Query() params: unknown) {

    const res = await firstValueFrom(this.client.send({ cmd: 'test-micro' }, params));

    this.client.emit('test-micro-emit', params);
    console.log(res, '==');
    return { status: 'ok', data: res };
  }
}
