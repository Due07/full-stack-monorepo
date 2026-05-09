import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '@/modules/auth/dto/api-error-response.dto';

export function ApiCommonErrorResponses(options?: {
  badRequest?: string;
  unauthorized?: string;
  forbidden?: string;
  notFound?: string;
  conflict?: string;
}): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ApiBadRequestResponse({ description: options?.badRequest ?? '请求参数不合法', schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
    ApiUnauthorizedResponse({ description: options?.unauthorized ?? '未登录或令牌无效', schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
    ApiForbiddenResponse({ description: options?.forbidden ?? '无权限或账号状态不可用', schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
    ApiNotFoundResponse({ description: options?.notFound ?? '目标资源不存在', schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
    ApiConflictResponse({ description: options?.conflict ?? '资源状态冲突', schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
  );
}
