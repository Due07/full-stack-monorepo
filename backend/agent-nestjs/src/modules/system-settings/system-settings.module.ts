import { Global, Module } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsInitService } from './system-settings-init.service';
import { SystemSettingsService } from './system-settings.service';

@Global()
@Module({
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, SystemSettingsInitService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
