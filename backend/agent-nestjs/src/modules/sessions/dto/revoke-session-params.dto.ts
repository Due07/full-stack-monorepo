import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RevokeSessionParamsDto {
  @ApiProperty()
  @IsString()
  public sessionId!: string;
}
