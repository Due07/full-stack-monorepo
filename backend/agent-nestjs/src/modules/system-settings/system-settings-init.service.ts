import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';

@Injectable()
export class SystemSettingsInitService implements OnApplicationBootstrap {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.systemSettingsService.EnsureDefaults();
  }
}
