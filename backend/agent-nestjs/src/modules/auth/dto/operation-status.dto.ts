import { ApiProperty } from '@nestjs/swagger';

export class OperationStatusDto {
  @ApiProperty({ description: '操作执行结果', example: 'ok' })
  public status!: string;
}
