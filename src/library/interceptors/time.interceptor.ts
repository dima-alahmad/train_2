import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const method = req.method;
    const url = req.originalUrl ?? req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${durationMs}ms`);
          }
          this.logger.log(`${method} ${url} -> ${res.statusCode} (${durationMs}ms)`);
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startTime;
          const message = err instanceof Error ? err.message : 'Unknown error';
          this.logger.warn(`${method} ${url} failed in ${durationMs}ms: ${message}`);
        },
      }),
    );
  }
}