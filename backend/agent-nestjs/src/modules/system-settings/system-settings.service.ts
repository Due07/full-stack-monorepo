import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SystemSetting } from '@prisma/client';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SYSTEM_SETTING_DEFINITIONS, SYSTEM_SETTING_KEYS, type TSystemSettingKey } from './constants/SystemSetting';

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  public async EnsureDefaults(): Promise<void> {
    const entries = Object.entries(SYSTEM_SETTING_DEFINITIONS) as Array<[
      TSystemSettingKey,
      (typeof SYSTEM_SETTING_DEFINITIONS)[TSystemSettingKey],
    ]>;

    await Promise.all(entries.map(async ([key, definition]) => {
      await this.prismaService.systemSetting.upsert({
        where: { key },
        update: {},
        create: {
          key,
          value: definition.defaultValue,
          description: definition.description,
        },
      });
    }));
  }

  public async List(): Promise<SystemSetting[]> {
    await this.EnsureDefaults();

    return this.prismaService.systemSetting.findMany({
      where: { key: { in: Object.keys(SYSTEM_SETTING_DEFINITIONS) } },
      orderBy: { key: 'asc' },
    });
  }

  public async Update(key: string, value: string, operatorUserId: string): Promise<SystemSetting> {
    const definition = this.GetDefinition(key);
    const normalizedValue = this.NormalizeValue(definition.valueType, value);

    const setting = await this.prismaService.systemSetting.upsert({
      where: { key },
      update: {
        value: normalizedValue,
        description: definition.description,
      },
      create: {
        key,
        value: normalizedValue,
        description: definition.description,
      },
    });

    await this.auditLogsService.Create({
      action: 'admin.system-setting.update',
      operatorUser: { connect: { id: operatorUserId } },
      metadata: {
        key,
        value: normalizedValue,
      },
    });

    return setting;
  }

  public async GetBooleanValue(key: TSystemSettingKey, fallback: boolean): Promise<boolean> {
    const definition = this.GetDefinition(key);
    const setting = await this.prismaService.systemSetting.findUnique({ where: { key } });
    const value = setting?.value ?? definition.defaultValue ?? String(fallback);

    return value === 'true';
  }

  public IsPublicUserRegisterEnabled(): Promise<boolean> {
    return this.GetBooleanValue(SYSTEM_SETTING_KEYS.PUBLIC_USER_REGISTER_ENABLED, false);
  }

  private GetDefinition(key: string) {
    const definition = SYSTEM_SETTING_DEFINITIONS[key as TSystemSettingKey];
    if (!definition) {
      throw new NotFoundException('System setting not found');
    }

    return definition;
  }

  private NormalizeValue(valueType: 'boolean', value: string): string {
    if (valueType === 'boolean') {
      if (value !== 'true' && value !== 'false') {
        throw new BadRequestException('System setting value is invalid');
      }

      return value;
    }

    return value;
  }
}
