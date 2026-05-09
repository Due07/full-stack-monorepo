import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminUserItemDto } from './admin-user-item.dto';

export class AdminUserDetailDto extends AdminUserItemDto {
  @ApiPropertyOptional({ nullable: true, description: '最后登录时间' })
  public lastLoginAt!: string | null;
}
