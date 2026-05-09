import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty()
  public userId!: string;

  @ApiProperty()
  public sessionId!: string;

  @ApiProperty()
  public role!: string;

  @ApiProperty()
  public tokenVersion!: number;
}
