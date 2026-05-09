import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public username!: string;

  @ApiPropertyOptional({ nullable: true, description: '外显名称，用于前端展示' })
  public displayName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  public phone!: string | null;

  @ApiProperty()
  public role!: string;

  @ApiProperty()
  public status!: string;
}
