import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiSuccessResponseDto } from '@/modules/auth/dto/api-success-response.dto';

export function ApiSuccessResponse(model: Type<unknown>, description?: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}
