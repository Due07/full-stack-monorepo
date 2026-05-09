import { ApiProperty } from '@nestjs/swagger';
import { AdminUserItemDto } from './admin-user-item.dto';

export class AdminUserListDataDto {
  @ApiProperty({ description: '总条数' })
  public total!: number;

  @ApiProperty({ description: '当前页码' })
  public page!: number;

  @ApiProperty({ description: '每页数量' })
  public pageSize!: number;

  @ApiProperty({ type: [AdminUserItemDto], description: '用户列表' })
  public items!: AdminUserItemDto[];
}
