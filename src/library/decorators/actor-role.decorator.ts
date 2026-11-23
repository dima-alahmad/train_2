import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../library/library.types.js';

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set(['admin', 'member']);

type RequestWithActor = {
  headers?: Record<string, string | string[] | undefined>;
  user?: {
    roles?: string[];
    role?: string;
  };
};

function parseRole(raw?: string): UserRole | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().toLowerCase();
  return ALLOWED_ROLES.has(normalized as UserRole)
    ? (normalized as UserRole)
    : undefined;
}

export const ActorRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithActor>();

    if (request.user?.role) {
      const fromUserRole = parseRole(request.user.role);
      if (fromUserRole) return fromUserRole;
    }

    if (Array.isArray(request.user?.roles)) {
      for (const r of request.user.roles) {
        const parsed = parseRole(r);
        if (parsed) return parsed;
      }
    }

    const headerVal = request.headers?.['x-user-role'];
    if (typeof headerVal === 'string') {
      const firstToken = headerVal.split(',')[0];
      return parseRole(firstToken);
    }

    return undefined;
  },
);