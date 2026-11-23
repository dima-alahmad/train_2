import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let errorCode: string | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const bodyObj = exceptionResponse as Record<string, unknown>;

      if (typeof bodyObj.message === 'string' || Array.isArray(bodyObj.message)) {
        message = bodyObj.message as string | string[];
      }

      if (typeof bodyObj.errorCode === 'string') {
        errorCode = bodyObj.errorCode;
      }
    }

    if (!errorCode && exception instanceof HttpException) {
      const directCode = (exception as unknown as Record<string, unknown>).errorCode;
      if (typeof directCode === 'string') {
        errorCode = directCode;
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(
        `[GlobalHttpExceptionFilter] ${request.method} ${request.originalUrl} -> ${status}`,
        exception,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...(errorCode ? { errorCode } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message,
    });
  }
}
