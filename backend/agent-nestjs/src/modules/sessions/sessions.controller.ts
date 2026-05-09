import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '@/common/swagger/SwaggerError';
import { ApiSuccessResponse } from '@/common/swagger/SwaggerResponse';
import { CurrentUser, TCurrentUser } from '@/common/decorators/CurrentUser';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { AuthService } from '@/modules/auth/auth.service';
import { OperationStatusDto } from '@/modules/auth/dto/operation-status.dto';
import { LogoutAllSessionsDto } from './dto/logout-all-sessions.dto';
import { SessionItemDto } from './dto/session-item.dto';
import { SessionListResponseDto } from './dto/session-list-response.dto';
import { SessionsService } from './sessions.service';

@ApiTags('会话管理')
@ApiBearerAuth('access-token')
@ApiCommonErrorResponses()
@UseGuards(JwtAuthGuard)
@Controller('admin/sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取当前会话', description: '查询当前用户当前唯一有效登录会话的信息。' })
  @ApiSuccessResponse(SessionListResponseDto, '当前会话列表')
  public async GetSessions(@CurrentUser() currentUser: TCurrentUser): Promise<SessionListResponseDto> {
    const sessions = await this.sessionsService.FindByUserId(currentUser.userId);
    return {
      items: sessions.map<SessionItemDto>((item) => ({
        sessionId: item.sessionId,
        deviceType: item.deviceType,
        deviceName: item.deviceName,
        clientIp: item.clientIp,
        userAgent: item.userAgent,
        lastActiveAt: item.lastActiveAt?.toISOString() ?? null,
        expiresAt: item.expiresAt.toISOString(),
        isRevoked: item.isRevoked,
      })),
    };
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: '退出当前会话', description: '让当前用户当前唯一有效会话失效。' })
  @ApiSuccessResponse(OperationStatusDto, '退出当前会话结果')
  public DeleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    return this.authService.Logout(currentUser, sessionId);
  }

  @Post('logout-all')
  @ApiOperation({ summary: '全部下线', description: '让当前用户当前唯一有效会话立即失效。' })
  @ApiSuccessResponse(OperationStatusDto, '全部下线结果')
  public LogoutAll(
    @Body() _body: LogoutAllSessionsDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    return this.authService.LogoutAll(currentUser);
  }
}
