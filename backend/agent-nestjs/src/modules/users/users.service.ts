import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  public FindById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  public async FindByIdOrThrow(id: string): Promise<User> {
    const user = await this.FindById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  public FindByUsername(username: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { username } });
  }

  public FindByPhone(phone: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { phone } });
  }

  public FindByAccount(account: string): Promise<User | null> {
    if (/^1\d{10}$/.test(account)) {
      return this.FindByPhone(account);
    }

    return this.FindByUsername(account);
  }

  public Create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prismaService.user.create({ data });
  }

  public async FindMany(page: number, pageSize: number): Promise<{ items: User[]; total: number }> {
    return this.FindManyByRoleScope(page, pageSize);
  }

  public async FindManyByRoleScope(page: number, pageSize: number, operatorRole?: string): Promise<{ items: User[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const where = operatorRole === UserRole.admin
      ? { role: UserRole.user }
      : undefined;

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return { items, total };
  }

  public UpdateLastLoginAt(id: string): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  public UpdateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: { status },
    });
  }

  public UpdateRole(id: string, role: UserRole): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: { role },
    });
  }

  public IncrementTokenVersion(id: string): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }

  public SetTokenVersion(id: string, tokenVersion: number): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: { tokenVersion },
    });
  }
}
