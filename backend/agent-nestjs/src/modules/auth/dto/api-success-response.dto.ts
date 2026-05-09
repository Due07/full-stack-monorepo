import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponseDto {
  @ApiProperty({ description: '业务状态码，成功固定为 200', example: 200 })
  public code!: number;

  @ApiProperty({ description: '提示信息', example: 'success' })
  public msg!: string;

  @ApiProperty({ description: '业务返回数据' })
  public data!: unknown;
}
