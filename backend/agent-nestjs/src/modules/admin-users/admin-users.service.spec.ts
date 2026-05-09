import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { RedisService } from '@/modules/redis/redis.service';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { UsersService } from '@/modules/users/users.service';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let adminUsersService: AdminUsersService;

  const usersServiceMock = {
    FindById: jest.fn(),
    FindByUsername: jest.fn(),
    UpdateStatus: jest.fn(),
    IncrementTokenVersion: jest.fn(),
  };

  const sessionsServiceMock = {
    FindBySessionId: jest.fn(),
    FindByUserId: jest.fn(),
    RevokeBySessionId: jest.fn(),
    RevokeAllByUserId: jest.fn(),
  };

  const redisServiceMock = {
    DeleteKey: jest.fn(),
  };

  const auditLogsServiceMock = {
    Create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adminUsersService = new AdminUsersService(
      usersServiceMock as unknown as UsersService,
      sessionsServiceMock as unknown as SessionsService,
      redisServiceMock as unknown as RedisService,
      auditLogsServiceMock as unknown as AuditLogsService,
    );
  });

  it('should not allow admin to disable self', async () => {
    await expect(
      adminUsersService.UpdateUserStatus('admin-1', UserStatus.disabled, 'admin-1', UserRole.admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw when target user does not exist', async () => {
    usersServiceMock.FindById.mockResolvedValue(null);

    await expect(
      adminUsersService.UpdateUserStatus('user-404', UserStatus.disabled, 'admin-1', UserRole.admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should revoke all sessions after disabling user', async () => {
    usersServiceMock.FindById.mockResolvedValue({
      id: 'user-1',
      username: 'zhangsan',
      role: UserRole.user,
      status: UserStatus.active,
    });
    usersServiceMock.UpdateStatus.mockResolvedValue({
      id: 'user-1',
      username: 'zhangsan',
      role: UserRole.user,
      status: UserStatus.disabled,
    });
    sessionsServiceMock.FindByUserId.mockResolvedValue([{ sessionId: 'session-1' }]);

    await adminUsersService.UpdateUserStatus('user-1', UserStatus.disabled, 'admin-1', UserRole.admin);

    expect(sessionsServiceMock.RevokeAllByUserId).toHaveBeenCalledWith('user-1');
    expect(usersServiceMock.IncrementTokenVersion).toHaveBeenCalledWith('user-1');
    expect(redisServiceMock.DeleteKey).toHaveBeenCalledWith('auth:refresh:session-1');
  });

  it('should not allow admin to manage super admin', async () => {
    usersServiceMock.FindById.mockResolvedValue({
      id: 'user-1',
      username: 'root',
      role: UserRole.super_admin,
      status: UserStatus.active,
    });

    await expect(
      adminUsersService.UpdateUserStatus('user-1', UserStatus.disabled, 'admin-1', UserRole.admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should unfreeze login account by deleting related redis keys', async () => {
    await adminUsersService.UnfreezeLoginAccount('Admin', 'super-1', 'manual reset');

    expect(redisServiceMock.DeleteKey).toHaveBeenCalledWith('auth:login:fail:admin');
    expect(redisServiceMock.DeleteKey).toHaveBeenCalledWith('auth:login:freeze:admin');
    expect(auditLogsServiceMock.Create).toHaveBeenCalled();
  });
});
