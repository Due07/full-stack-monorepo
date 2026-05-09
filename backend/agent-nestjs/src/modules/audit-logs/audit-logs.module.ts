import { Global, Module } from '@nestjs/common';
import { AuditLogRetentionService } from './audit-log-retention.service';
import { AuditLogsService } from './audit-logs.service';

@Global()
@Module({
  providers: [AuditLogsService, AuditLogRetentionService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
