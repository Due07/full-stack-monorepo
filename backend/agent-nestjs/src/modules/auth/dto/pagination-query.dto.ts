import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  public page = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(100)
  public pageSize = 10;
}
