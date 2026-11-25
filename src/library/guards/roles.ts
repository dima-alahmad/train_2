import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../library/library.types.js';
import { Roles } from './roles.decorator.js';

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set(['admin', 'member']);

type AuthenticatedRequest = {
  user?: {
    sub?: string | number;
    roles?: string[];
    role?: string;
  };
};

function isUserRole(value: string): value is UserRole {
  return ALLOWED_ROLES.has(value as UserRole);
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const rawCandidates = [
      ...(request.user.roles ?? []),
      ...(request.user.role ? [request.user.role] : []),
    ].map((r) => r.trim().toLowerCase());

    const userRoles: UserRole[] = rawCandidates.filter(isUserRole);

    const allowed = requiredRoles.some((role) => userRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenException(
        `Requires one of the following roles: ${requiredRoles.join(', ')}`,
        { errorCode: 'FORBIDDEN_ROLE' },
      );
    }

    return true;
  }
}