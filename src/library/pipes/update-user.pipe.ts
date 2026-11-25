import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { UpdateUserChangesDto } from '../../library.dto.js';

@Injectable()
export class UpdateUserPipe
  implements PipeTransform<unknown, UpdateUserChangesDto>
{
  transform(
    value: unknown,
    _metadata: ArgumentMetadata,
  ): UpdateUserChangesDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    const raw = value as Record<string, unknown>;
    const updates: UpdateUserChangesDto = {};

    if ('name' in raw && raw.name !== undefined) {
      if (typeof raw.name !== 'string') {
        throw new BadRequestException('Name must be a string');
      }
      const trimmedName = raw.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Name cannot be empty');
      }
      updates.name = trimmedName;
    }

    if ('email' in raw && raw.email !== undefined) {
      if (typeof raw.email !== 'string') {
        throw new BadRequestException('Email must be a string');
      }
      const normalizedEmail = raw.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new BadRequestException('Email format is invalid');
      }
      updates.email = normalizedEmail;
    }

    if ('active' in raw && raw.active !== undefined) {
      if (typeof raw.active !== 'boolean') {
        throw new BadRequestException('Active must be a boolean');
      }
      updates.active = raw.active;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update: name, email, or active',
      );
    }

    return updates;
  }
}