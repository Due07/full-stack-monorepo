import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ?? exception.message;

      response.status(status).json({
        code: status,
        msg: Array.isArray(message) ? message.join(', ') : message,
        data: typeof exceptionResponse === 'object' ? exceptionResponse : null,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Internal server error',
      data: null,
    });
  }
}
