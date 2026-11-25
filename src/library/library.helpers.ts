import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UserRole } from './library.types.js';

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown library error';
}

export function findOrThrow<K, V>(map: Map<K, V>, id: K, entityName: string): V {
  const item = map.get(id);
  if (item === undefined) {
    throw new NotFoundException(`${entityName} with ID ${String(id)} was not found`);
  }
  return item;
}

export function assertUserAccess(
  userId: number,
  actorRole: UserRole | undefined,
  actorUserId: number | undefined,
): void {
  if (actorRole === 'admin') {
    return;
  }

  if (actorRole !== 'member' || actorUserId !== userId) {
    throw new ForbiddenException('You can only access your own user data', {
      errorCode: 'USER_ACCESS_FORBIDDEN',
    });
  }
}
