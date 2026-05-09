import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/prisma/prisma.service';

const LOGIN_HISTORY_ACTIONS = ['auth.login.success', 'auth.login.failed'];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuditLogRetentionService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AuditLogRetentionService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService<TGlobalEnv>,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.RunCleanup();

    if ((this.configService.get('NODE_ENV') ?? 'development') !== 'test') {
      this.timer = setInterval(() => {
        void this.RunCleanup();
      }, ONE_DAY_MS);
    }
  }

  public onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async RunCleanup(): Promise<void> {
    const auditRetentionDays = Number(this.configService.get('AUDIT_LOG_RETENTION_DAYS') ?? '7');
    const loginHistoryRetentionDays = Number(this.configService.get('LOGIN_HISTORY_RETENTION_DAYS') ?? '15');
    const now = Date.now();
    const auditCutoff = new Date(now - auditRetentionDays * ONE_DAY_MS);
    const loginHistoryCutoff = new Date(now - loginHistoryRetentionDays * ONE_DAY_MS);

    const loginHistoryResult = await this.prismaService.auditLog.deleteMany({
      where: {
        action: { in: LOGIN_HISTORY_ACTIONS },
        createdAt: { lt: loginHistoryCutoff },
      },
    });
    const auditLogResult = await this.prismaService.auditLog.deleteMany({
      where: {
        action: { notIn: LOGIN_HISTORY_ACTIONS },
        createdAt: { lt: auditCutoff },
      },
    });

    if (loginHistoryResult.count > 0 || auditLogResult.count > 0) {
      this.logger.log(`Audit retention cleanup completed: loginHistory=${loginHistoryResult.count}, auditLogs=${auditLogResult.count}`);
    }
  }
}
