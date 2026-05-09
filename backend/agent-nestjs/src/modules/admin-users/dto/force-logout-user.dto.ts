import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForceLogoutUserDto {
  @ApiProperty()
  @IsString()
  public sessionId!: string;
}
