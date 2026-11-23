import {
  ArgumentMetadata,
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const MIN_PUBLICATION_YEAR = 1000;

@Injectable()
export class PublicationYearPipe implements PipeTransform<unknown, number> {
  transform(value: unknown, metadata: ArgumentMetadata): number {
    const fieldName = metadata.data ?? 'yearOfPublication';
    const currentYear = new Date().getFullYear();

    if (
      value === undefined ||
      value === null ||
      typeof value === 'boolean' ||
      typeof value === 'object'
    ) {
      throw new BadRequestException(
        `${fieldName} must be a valid publication year`,
        { errorCode: 'INVALID_PUBLICATION_YEAR' },
      );
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0 || !/^\d+$/.test(trimmed)) {
        throw new BadRequestException(
          `${fieldName} must be a valid publication year`,
          { errorCode: 'INVALID_PUBLICATION_YEAR' },
        );
      }
      value = trimmed;
    }

    const year = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(year) || year < MIN_PUBLICATION_YEAR) {
      throw new BadRequestException(
        `${fieldName} must be an integer greater than or equal to ${MIN_PUBLICATION_YEAR}`,
        { errorCode: 'INVALID_PUBLICATION_YEAR' },
      );
    }

    if (year > currentYear) {
      throw new BadRequestException(
        `${fieldName} cannot be greater than the current year (${currentYear})`,
        { errorCode: 'FUTURE_PUBLICATION_YEAR' },
      );
    }

    return year;
  }
}

export const OptionalPublicationYear = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      body?: Record<string, unknown>;
    }>();
    const rawYear = request.body?.yearOfPublication;

    if (rawYear === undefined) {
      return undefined;
    }

    const pipe = new PublicationYearPipe();
    return pipe.transform(rawYear, {
      type: 'body',
      data: 'yearOfPublication',
    });
  },
);