import { InitLogger, LogFn } from '@/decorators/LoggerDecorators';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';

@Controller()
export class AppController {

  @MessagePattern({ cmd: 'test-micro' })
  public getTestMicro(params: unknown) {
    console.log('====', params, '@');
    return {
      date: new Date().toLocaleString(),
      data: randomUUID(),
    };
  }

  @InitLogger
  public aa!: Logger;

  @LogFn('123123', 'log')
  public bbb() {

  };

  @EventPattern('test-micro-emit')
  public getTestMicroEmit(params: unknown) {
    console.log('====', params, '@ emit 已接受， 无法放回结果');
  }

};
