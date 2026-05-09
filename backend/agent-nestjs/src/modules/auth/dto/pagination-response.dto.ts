import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto<T> {
  @ApiProperty()
  public total!: number;

  @ApiProperty()
  public page!: number;

  @ApiProperty()
  public pageSize!: number;

  @ApiProperty({ isArray: true })
  public items!: T[];
}
