import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Argon2 from 'argon2';
import { User, UserRole, UserStatus } from '@prisma/client';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { RedisService } from '@/modules/redis/redis.service';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { UsersService } from '@/modules/users/users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly configService: ConfigService<TGlobalEnv>,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  public async CreateUser(body: CreateAdminUserDto, operatorUserId: string, operatorRole: string): Promise<User> {
    const targetRole = body.role ?? UserRole.user;

    if (operatorRole === UserRole.admin && targetRole !== UserRole.user) {
      throw new ForbiddenException('Admin can only create user role account');
    }

    const username = body.username.trim();
    const existingByUsername = await this.usersService.FindByUsername(username);
    if (existingByUsername) {
      throw new ConflictException('Username already exists');
    }

    if (body.phone) {
      const existingByPhone = await this.usersService.FindByPhone(body.phone);
      if (existingByPhone) {
        throw new ConflictException('Phone already exists');
      }
    }

    const passwordHash = await this.HashPassword(body.password);
    const user = await this.usersService.Create({
      username,
      displayName: body.displayName?.trim() || null,
      phone: body.phone ?? null,
      passwordHash,
      role: targetRole,
    });

    await this.auditLogsService.Create({
      action: 'admin.user.create',
      user: { connect: { id: user.id } },
      operatorUser: { connect: { id: operatorUserId } },
      metadata: { role: targetRole },
    });

    return user;
  }

  public ListUsers(page: number, pageSize: number, operatorRole: string) {
    return this.usersService.FindManyByRoleScope(page, pageSize, operatorRole);
  }

  public async GetUserDetail(targetUserId: string, operatorRole: string): Promise<User> {
    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.AssertCanViewTarget(user.role, operatorRole);
    return user;
  }

  public async GetUserSessions(targetUserId: string, operatorRole: string) {
    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.AssertCanViewTarget(user.role, operatorRole);
    return this.sessionsService.FindByUserId(targetUserId);
  }

  public async GetUserLoginHistory(
    targetUserId: string,
    operatorRole: string,
    page: number,
    pageSize: number,
  ) {
    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.AssertCanViewTarget(user.role, operatorRole);
    return this.auditLogsService.FindMany({
      userId: targetUserId,
      action: { in: ['auth.login.success', 'auth.login.failed'] },
    }, page, pageSize);
  }

  public GetAuditLogs(page: number, pageSize: number, operatorRole: string) {
    if (operatorRole !== UserRole.super_admin) {
      throw new ForbiddenException('Only super admin can view audit logs');
    }

    return this.auditLogsService.FindMany({}, page, pageSize);
  }

  public async UpdateUserStatus(
    targetUserId: string,
    status: UserStatus,
    operatorUserId: string,
    operatorRole: string,
    reason?: string,
  ): Promise<User> {
    if (targetUserId === operatorUserId) {
      throw new ForbiddenException('Admin cannot disable self');
    }

    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.AssertCanManageTarget(user.role, operatorRole);

    const updatedUser = await this.usersService.UpdateStatus(targetUserId, status);
    if (status === 'disabled') {
      await this.RevokeAllSessions(targetUserId);
    }

    await this.auditLogsService.Create({
      action: status === 'disabled' ? 'user.disable' : 'user.enable',
      metadata: { reason: reason ?? null },
      user: { connect: { id: targetUserId } },
      operatorUser: { connect: { id: operatorUserId } },
    });

    return updatedUser;
  }

  public async RevokeSession(targetUserId: string, sessionId: string, operatorUserId: string, operatorRole: string): Promise<void> {
    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.AssertCanManageTarget(user.role, operatorRole);

    const session = await this.sessionsService.FindBySessionId(sessionId);
    if (!session || session.userId !== targetUserId) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionsService.RevokeBySessionId(sessionId);
    await this.redisService.DeleteKey(`auth:refresh:${sessionId}`);
    await this.auditLogsService.Create({
      action: 'session.revoke',
      user: { connect: { id: targetUserId } },
      operatorUser: { connect: { id: operatorUserId } },
      metadata: { sessionId },
    });
  }

  public async RevokeAllSessions(targetUserId: string, operatorUserId?: string, operatorRole?: string): Promise<void> {
    const user = await this.usersService.FindById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (operatorRole) {
      this.AssertCanManageTarget(user.role, operatorRole);
    }

    const sessions = await this.sessionsService.FindByUserId(targetUserId);

    await this.sessionsService.RevokeAllByUserId(targetUserId);
    await this.usersService.IncrementTokenVersion(targetUserId);

    for (const session of sessions) {
      await this.redisService.DeleteKey(`auth:refresh:${session.sessionId}`);
    }

    if (operatorUserId) {
      await this.auditLogsService.Create({
        action: 'session.revoke_all',
        user: { connect: { id: targetUserId } },
        operatorUser: { connect: { id: operatorUserId } },
      });
    }
  }

  public async UnfreezeLoginAccount(account: string, operatorUserId: string, reason?: string): Promise<void> {
    const normalizedAccount = this.NormalizeAccount(account);
    await this.redisService.DeleteKey(this.BuildLoginFailKey(normalizedAccount));
    await this.redisService.DeleteKey(this.BuildLoginFreezeKey(normalizedAccount));
    await this.auditLogsService.Create({
      action: 'auth.login.unfreeze',
      operatorUser: { connect: { id: operatorUserId } },
      metadata: {
        account: normalizedAccount,
        reason: reason ?? null,
      },
    });
  }

  private AssertCanManageTarget(targetRole: UserRole, operatorRole: string): void {
    if (operatorRole === UserRole.super_admin) {
      return;
    }

    if (targetRole !== UserRole.user) {
      throw new ForbiddenException('Only super admin can manage admin or super admin');
    }
  }

  private AssertCanViewTarget(targetRole: UserRole, operatorRole: string): void {
    if (operatorRole === UserRole.super_admin) {
      return;
    }

    if (targetRole !== UserRole.user) {
      throw new ForbiddenException('Only super admin can view admin or super admin');
    }
  }

  private NormalizeAccount(account: string): string {
    return account.trim().toLowerCase();
  }

  private async HashPassword(password: string): Promise<string> {
    const pepper = this.configService.get('PASSWORD_PEPPER') ?? '';
    return Argon2.hash(`${password}${pepper}`);
  }

  private BuildLoginFailKey(account: string): string {
    return `auth:login:fail:${account}`;
  }

  private BuildLoginFreezeKey(account: string): string {
    return `auth:login:freeze:${account}`;
  }
}
