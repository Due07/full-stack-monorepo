import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type TApiSuccessResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, TApiSuccessResponse<T>> {
  public intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        msg: 'success',
        data,
      })),
    );
  }
}
