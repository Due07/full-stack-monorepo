import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type TCurrentUser = {
  userId: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TCurrentUser => {
    const request = context.switchToHttp().getRequest<{ user: TCurrentUser }>();
    return request.user;
  },
);
