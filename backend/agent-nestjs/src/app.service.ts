import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  public GetHealth(): { status: string; timestamp: string } {
    const timestamp = new Date().toISOString();
    this.logger.log(`Health endpoint called at ${timestamp}`);

    return {
      status: 'ok',
      timestamp,
    };
  }
}
