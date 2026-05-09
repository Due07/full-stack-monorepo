import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '@/common/swagger/SwaggerError';
import { ApiSuccessResponse } from '@/common/swagger/SwaggerResponse';
import { OperationStatusDto } from '@/modules/auth/dto/operation-status.dto';
import { CurrentUser, TCurrentUser } from '@/common/decorators/CurrentUser';
import { Roles } from '@/common/decorators/Roles';
import { RolesGuard } from '@/common/guards/Roles.guard';
import { ToApiUserRole } from '@/common/utils/RoleMapper';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { PaginationResponseDto } from '@/modules/auth/dto/pagination-response.dto';
import { AdminUsersService } from './admin-users.service';
import { AdminUserDetailDto } from './dto/admin-user-detail.dto';
import { AdminAuditLogListDataDto } from './dto/admin-audit-log-list-data.dto';
import { AdminUserItemDto } from './dto/admin-user-item.dto';
import { AdminUserListDataDto } from './dto/admin-user-list-data.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import { AdminUserSessionListDataDto } from './dto/admin-user-session-list-data.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ForceLogoutAllUserSessionsDto } from './dto/force-logout-all-user-sessions.dto';
import { ForceLogoutUserDto } from './dto/force-logout-user.dto';
import { UnfreezeLoginAccountDto } from './dto/unfreeze-login-account.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('管理员-用户管理')
@ApiBearerAuth('access-token')
@ApiCommonErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) { }

  @Post()
  @ApiOperation({ summary: '创建用户', description: '管理员或超级管理员在后台创建账号。admin 只能创建 user；superAdmin 可创建 user 或 admin。' })
  @ApiSuccessResponse(AdminUserDetailDto, '创建后的用户详情')
  public async CreateUser(
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<AdminUserDetailDto> {
    const user = await this.adminUsersService.CreateUser(body, currentUser.userId, currentUser.role);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      phone: user.phone,
      role: ToApiUserRole(user.role),
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  @Get()
  @ApiOperation({ summary: '分页查询用户', description: '管理员分页获取系统用户列表。' })
  @ApiSuccessResponse(AdminUserListDataDto, '分页用户列表')
  public async GetUsers(@Query() query: AdminUserListQueryDto, @CurrentUser() currentUser: TCurrentUser): Promise<PaginationResponseDto<AdminUserItemDto>> {
    const result = await this.adminUsersService.ListUsers(query.page, query.pageSize, currentUser.role);
    return {
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
      items: result.items.map((item) => ({
        id: item.id,
        username: item.username,
        displayName: item.displayName ?? null,
        phone: item.phone,
        role: ToApiUserRole(item.role),
        status: item.status,
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情', description: '管理员根据用户 ID 查询用户详情。' })
  @ApiSuccessResponse(AdminUserDetailDto, '用户详情')
  public async GetUserDetail(@Param('id') id: string, @CurrentUser() currentUser: TCurrentUser): Promise<AdminUserDetailDto> {
    const user = await this.adminUsersService.GetUserDetail(id, currentUser.role);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      phone: user.phone,
      role: ToApiUserRole(user.role),
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '修改用户状态', description: '管理员启用或禁用指定用户。禁用后立即全部下线。' })
  @ApiSuccessResponse(AdminUserDetailDto, '更新后的用户详情')
  public async UpdateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<AdminUserDetailDto> {
    const user = await this.adminUsersService.UpdateUserStatus(id, body.status, currentUser.userId, currentUser.role, body.reason);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      phone: user.phone,
      role: ToApiUserRole(user.role),
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  @Post(':id/force-logout')
  @ApiOperation({ summary: '强制下线用户', description: '管理员让目标用户当前唯一有效会话立即失效。' })
  @ApiSuccessResponse(OperationStatusDto, '强制下线结果')
  public async ForceLogout(
    @Param('id') id: string,
    @Body() body: ForceLogoutUserDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    await this.adminUsersService.RevokeSession(id, body.sessionId, currentUser.userId, currentUser.role);
    return { status: 'ok' };
  }

  @Post(':id/force-logout-all')
  @ApiOperation({ summary: '强制全部下线', description: '在单登录策略下，该操作等同于让目标用户当前唯一有效会话立即失效。' })
  @ApiSuccessResponse(OperationStatusDto, '强制全部下线结果')
  public async ForceLogoutAll(
    @Param('id') id: string,
    @Body() _body: ForceLogoutAllUserSessionsDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    await this.adminUsersService.RevokeAllSessions(id, currentUser.userId, currentUser.role);
    return { status: 'ok' };
  }

  @Post('unfreeze-login')
  @ApiOperation({ summary: '解封登录账号', description: '管理员解除指定账号因频繁登录导致的冻结状态。' })
  @ApiSuccessResponse(OperationStatusDto, '解封结果')
  public async UnfreezeLogin(
    @Body() body: UnfreezeLoginAccountDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    await this.adminUsersService.UnfreezeLoginAccount(body.account, currentUser.userId, body.reason);
    return { status: 'ok' };
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: '查看用户会话', description: '管理员查看指定用户当前/历史会话列表。' })
  @ApiSuccessResponse(AdminUserSessionListDataDto, '用户会话列表')
  public async GetUserSessions(
    @Param('id') id: string,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<AdminUserSessionListDataDto> {
    const sessions = await this.adminUsersService.GetUserSessions(id, currentUser.role);
    return {
      items: sessions.map((item) => ({
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

  @Get(':id/login-history')
  @ApiOperation({ summary: '查看用户登录历史', description: '管理员分页查看指定用户登录成功/失败记录。' })
  @ApiSuccessResponse(AdminAuditLogListDataDto, '用户登录历史')
  public async GetUserLoginHistory(
    @Param('id') id: string,
    @Query() query: AdminUserListQueryDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<AdminAuditLogListDataDto> {
    const result = await this.adminUsersService.GetUserLoginHistory(id, currentUser.role, query.page, query.pageSize);
    return {
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
      items: result.items.map((item) => ({
        id: item.id,
        action: item.action,
        userId: item.userId,
        username: item.user?.username ?? null,
        operatorUserId: item.operatorUserId,
        operatorUsername: item.operatorUser?.username ?? null,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  @Get('audit-logs/list')
  @ApiOperation({ summary: '查看审计日志', description: '超级管理员分页查看全量审计日志。' })
  @ApiSuccessResponse(AdminAuditLogListDataDto, '审计日志列表')
  public async GetAuditLogs(
    @Query() query: AdminUserListQueryDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<AdminAuditLogListDataDto> {
    const result = await this.adminUsersService.GetAuditLogs(query.page, query.pageSize, currentUser.role);
    return {
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
      items: result.items.map((item) => ({
        id: item.id,
        action: item.action,
        userId: item.userId,
        username: item.user?.username ?? null,
        operatorUserId: item.operatorUserId,
        operatorUsername: item.operatorUser?.username ?? null,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
