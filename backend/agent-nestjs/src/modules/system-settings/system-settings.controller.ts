import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '@/common/swagger/SwaggerError';
import { ApiSuccessResponse } from '@/common/swagger/SwaggerResponse';
import { CurrentUser, TCurrentUser } from '@/common/decorators/CurrentUser';
import { Roles } from '@/common/decorators/Roles';
import { RolesGuard } from '@/common/guards/Roles.guard';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { SystemSettingItemDto, SystemSettingListDataDto, UpdateSystemSettingDto } from './dto/system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('管理端-系统配置')
@ApiBearerAuth('access-token')
@ApiCommonErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) { }

  @Get()
  @ApiOperation({ summary: '获取系统配置', description: '后台工作台读取当前可管理的系统配置项。' })
  @ApiSuccessResponse(SystemSettingListDataDto, '系统配置列表')
  public async GetList(): Promise<SystemSettingListDataDto> {
    const items = await this.systemSettingsService.List();

    return {
      items: items.map((item) => ({
        key: item.key,
        value: item.value,
        description: item.description ?? null,
        updatedAt: item.updatedAt.toISOString(),
      })),
    };
  }

  @Patch(':key')
  @ApiOperation({ summary: '更新系统配置', description: '后台管理员更新指定配置项的值。' })
  @ApiSuccessResponse(SystemSettingItemDto, '更新后的配置项')
  public async Update(
    @Param('key') key: string,
    @Body() body: UpdateSystemSettingDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<SystemSettingItemDto> {
    const item = await this.systemSettingsService.Update(key, body.value, currentUser.userId);

    return {
      key: item.key,
      value: item.value,
      description: item.description ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
