import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty()
  public code!: number;

  @ApiProperty()
  public msg!: string;

  @ApiPropertyOptional()
  public data?: unknown;
}
