import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserItemDto {
  @ApiProperty({ description: '用户 ID' })
  public id!: string;

  @ApiProperty({ description: '用户名' })
  public username!: string;

  @ApiPropertyOptional({ nullable: true, description: '外显名称' })
  public displayName!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '手机号' })
  public phone!: string | null;

  @ApiProperty({ description: '角色：user | admin | superAdmin' })
  public role!: string;

  @ApiProperty({ description: '状态：active | disabled' })
  public status!: string;
}
