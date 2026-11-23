import { BadRequestException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

export function libraryMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();
  const method = req.method.toUpperCase();

  if (WRITE_METHODS.has(method)) {
    const requestIdHeader = req.headers['x-request-id'];

    if (requestIdHeader !== undefined) {
      if (
        typeof requestIdHeader !== 'string' ||
        requestIdHeader.trim().length === 0 ||
        requestIdHeader.trim().length > 100
      ) {
        throw new BadRequestException('Invalid x-request-id header', {
          errorCode: 'INVALID_REQUEST_ID',
        });
      }
    }

    if (method === 'POST' || method === 'PATCH') {
      if (
        req.body === undefined ||
        req.body === null ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        throw new BadRequestException('Request body must be a valid JSON object', {
          errorCode: 'INVALID_REQUEST_BODY',
        });
      }
    }
  }

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    console.log(
      `[libraryMiddleware] ${method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
    );
  });

  next();
}