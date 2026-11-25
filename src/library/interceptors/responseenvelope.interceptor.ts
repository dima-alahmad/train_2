import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

export interface EnvelopedResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, EnvelopedResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<EnvelopedResponse<T> | T> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((value) => {
        if (res.headersSent || res.statusCode === 204 || value === undefined) {
          return value;
        }
        return {
         success: true,
          data: value,
        };
      }),
    );
  }
}