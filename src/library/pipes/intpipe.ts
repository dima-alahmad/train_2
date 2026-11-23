import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const MAX_DB_INT = 2_147_483_647;
const MIN_POSITIVE_INT = 1;

@Injectable()
export class DbIntPipe implements PipeTransform<unknown, number> {
  transform(value: unknown, metadata: ArgumentMetadata): number {
    const fieldName = metadata.data ?? 'id';

    if (
      value === undefined ||
      value === null ||
      typeof value === 'boolean' ||
      typeof value === 'object'
    ) {
      throw new BadRequestException(`${fieldName} must be a positive integer`, {
        errorCode: 'INVALID_DB_INT',
      });
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0 || !/^\d+$/.test(trimmed)) {
        throw new BadRequestException(`${fieldName} must be a positive integer`, {
          errorCode: 'INVALID_DB_INT',
        });
      }
      value = trimmed;
    }

    const num = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(num) || num < MIN_POSITIVE_INT || num > MAX_DB_INT) {
      throw new BadRequestException(
        `${fieldName} must be an integer between ${MIN_POSITIVE_INT} and ${MAX_DB_INT}`,
        { errorCode: 'DB_INT_OUT_OF_RANGE' },
      );
    }

    return num;
  }
}