import { ApiProperty } from '@nestjs/swagger';
import { AdminUserSessionItemDto } from './admin-user-session-item.dto';

export class AdminUserSessionListDataDto {
  @ApiProperty({ type: [AdminUserSessionItemDto], description: '用户会话列表' })
  public items!: AdminUserSessionItemDto[];
}
