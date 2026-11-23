import { NotFoundException } from '@nestjs/common';

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