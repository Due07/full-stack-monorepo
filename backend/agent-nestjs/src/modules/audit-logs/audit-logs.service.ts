import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  public Create(data: Prisma.AuditLogCreateInput) {
    return this.prismaService.auditLog.create({ data });
  }

  public FindMany(
    where: Prisma.AuditLogWhereInput,
    page: number,
    pageSize: number,
  ): Promise<{ items: Prisma.AuditLogGetPayload<{ include: { user: true; operatorUser: true } }>[]; total: number }> {
    const skip = (page - 1) * pageSize;
    return this.prismaService.$transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.auditLog.findMany({
          where,
          include: {
            user: true,
            operatorUser: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        transaction.auditLog.count({ where }),
      ]);

      return { items, total };
    });
  }
}
