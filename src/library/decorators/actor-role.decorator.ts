import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../library/library.types.js';

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set(['admin', 'member']);

type RequestWithActor = {
  user?: {
    sub?: string | number;
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

export function parseActorUserId(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : undefined;
  }

  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
    return undefined;
  }

  const userId = Number(raw);
  return Number.isSafeInteger(userId) ? userId : undefined;
}

export const ActorRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithActor>();
    const roles = [
      parseRole(request.user?.role),
      ...(request.user?.roles ?? []).map(parseRole),
    ].filter((role): role is UserRole => role !== undefined);

    return roles.includes('admin') ? 'admin' : roles[0];
  },
);

export const ActorUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithActor>();
    return parseActorUserId(request.user?.sub);
  },
);
