import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Borrowable, Book, DVD, Magazine } from '../library/library.models.js';
import type { BorrowableId, SearchCriteria } from '../library/library.types.js';
import type {
  CreateBorrowableDto,
  UpdateBorrowableDto,
} from '../library.dto.js';
function requireNonNegativeInteger(
  value: unknown,
  fallback: number,
  fieldName: string,
): number {
  if (value === undefined) {
    return fallback;
  }

  const labels: Record<string, string> = {
    totalCopies: 'copies',
    pages: 'pages',
    minutes: 'minutes',
    release: 'release',
  };

  const label = labels[fieldName] ?? fieldName;

  if (typeof value !== 'number') {
    throw new BadRequestException(`Please provide a valid number of ${label}`);
  }

  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new BadRequestException(`Please provide a valid number of ${label}`);
  }

  return value;
}
@Injectable()
export class BorrowablesService {
  private readonly items = new Map<BorrowableId, Borrowable>();

  addItem(item: Borrowable): Borrowable {
    this.items.set(item.id, item);
    return item;
  }

  create(dto: CreateBorrowableDto): Borrowable {
    let item: Borrowable;

    if (typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('Please provide a title');
    }

    if (dto.type === 'book') {
      if (typeof dto.author !== 'string' || dto.author.trim().length === 0) {
        throw new BadRequestException('Please provide an author');
      }

      item = new Book(
        dto.title,
        requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
        requireNonNegativeInteger(dto.pages, 100, 'pages'),
        dto.author,
        dto.yearOfPublication ?? new Date().getFullYear(),
        dto.release !== undefined
          ? requireNonNegativeInteger(dto.release, 0, 'release')
          : undefined,
      );
    } else if (dto.type === 'dvd') {
      item = new DVD(
        dto.title,
        requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
        requireNonNegativeInteger(dto.minutes, 90, 'minutes'),
      );
    } else if (dto.type === 'magazine') {
      item = new Magazine(
        dto.title,
        requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
        requireNonNegativeInteger(dto.pages, 50, 'pages'),
      );
    } else {
      throw new BadRequestException('Please choose book dvd or magazine');
    }

    this.items.set(item.id, item);
    return item;
  }
  replace(id: BorrowableId, dto: CreateBorrowableDto): Borrowable {
    const existing = this.findById(id);

    if (typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('Please provide a title');
    }

    if (dto.type === 'book') {
      if (typeof dto.author !== 'string' || dto.author.trim().length === 0) {
        throw new BadRequestException('Please provide an author');
      }

      const replacement = new Book(
        dto.title,
        requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
        requireNonNegativeInteger(dto.pages, 100, 'pages'),
        dto.author,
        dto.yearOfPublication ?? new Date().getFullYear(),
        dto.release !== undefined
          ? requireNonNegativeInteger(dto.release, 0, 'release')
          : undefined,
      );

      Object.defineProperty(replacement, 'id', {
        value: existing.id,
        enumerable: true,
        configurable: false,
        writable: false,
      });

      this.items.set(existing.id, replacement);
      return replacement;
    }

    if (dto.type === 'dvd') {
      const replacement = new DVD(
        dto.title,
        requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
        requireNonNegativeInteger(dto.minutes, 90, 'minutes'),
      );

      Object.defineProperty(replacement, 'id', {
        value: existing.id,
        enumerable: true,
        configurable: false,
        writable: false,
      });

      this.items.set(existing.id, replacement);
      return replacement;
    }

    if (dto.type !== 'magazine') {
      throw new BadRequestException('Please choose book dvd or magazine');
    }

    const replacement = new Magazine(
      dto.title,
      requireNonNegativeInteger(dto.totalCopies, 1, 'totalCopies'),
      requireNonNegativeInteger(dto.pages, 50, 'pages'),
    );

    Object.defineProperty(replacement, 'id', {
      value: existing.id,
      enumerable: true,
      configurable: false,
      writable: false,
    });

    this.items.set(existing.id, replacement);
    return replacement;
  }
  update(id: BorrowableId, changes: UpdateBorrowableDto): Borrowable {
    const item = this.findById(id);

    if (changes.title !== undefined && typeof changes.title !== 'string') {
      throw new BadRequestException('Please provide a title');
    }

    if (changes.title !== undefined && changes.title.trim().length === 0) {
      throw new BadRequestException('Please provide a title');
    }

    const title = changes.title;
    let totalCopies: number | undefined;

    if (changes.totalCopies !== undefined) {
      totalCopies = requireNonNegativeInteger(
        changes.totalCopies,
        item.getTotalCopies,
        'totalCopies',
      );
      const borrowedCount = item.getTotalCopies - item.getAvailableCopies;
      if (totalCopies < borrowedCount) {
        throw new BadRequestException(
          'There are more copies borrowed than the number requested',
        );
      }
    }

    let author: string | undefined;
    let pages: number | undefined;
    let yearOfPublication: number | undefined;
    let release: number | undefined;
    let minutes: number | undefined;

    if (item instanceof Book) {
      if (changes.author !== undefined) {
        if (typeof changes.author !== 'string') {
          throw new BadRequestException('Please provide an author');
        }
        if (changes.author.trim().length === 0) {
          throw new BadRequestException('Please provide an author');
        }
        author = changes.author;
      }

      if (changes.pages !== undefined) {
        pages = requireNonNegativeInteger(changes.pages, item.pages, 'pages');
      }

      if (changes.yearOfPublication !== undefined) {
        const year = requireNonNegativeInteger(
          changes.yearOfPublication,
          new Date().getFullYear(),
          'yearOfPublication',
        );
        if (year < 1000 || year > new Date().getFullYear()) {
          throw new BadRequestException(
            'Please provide a valid publication year',
          );
        }
        yearOfPublication = year;
      }

      if (changes.release !== undefined) {
        release = requireNonNegativeInteger(changes.release, 0, 'release');
      }
    }

    if (item instanceof DVD && changes.minutes !== undefined) {
      minutes = requireNonNegativeInteger(
        changes.minutes,
        item.minutes,
        'minutes',
      );
    }

    if (item instanceof Magazine && changes.pages !== undefined) {
      pages = requireNonNegativeInteger(changes.pages, item.pages, 'pages');
    }

    if (title !== undefined) item.title = title;
    if (totalCopies !== undefined) item.setTotalCopies = totalCopies;

    if (item instanceof Book) {
      if (author !== undefined) item.author = author;
      if (pages !== undefined) item.pages = pages;
      if (yearOfPublication !== undefined) {
        item.yearOfPublication = yearOfPublication;
      }
      if (release !== undefined) item.release = release;
    }

    if (item instanceof DVD && minutes !== undefined) {
      item.minutes = minutes;
    }

    if (item instanceof Magazine && pages !== undefined) {
      item.pages = pages;
    }

    return item;
  }
  findById(id: BorrowableId): Borrowable {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException('We could not find that item');
    }
    return item;
  }

  findByCriteria(criteria: SearchCriteria): Borrowable[] {
    let matches = Array.from(this.items.values());

    if (criteria.id !== undefined) {
      matches = matches.filter((item) => item.id === criteria.id);
    }

    if (criteria.type !== undefined) {
      matches = matches.filter((item) => {
        if (criteria.type === 'book') return item instanceof Book;
        if (criteria.type === 'dvd') return item instanceof DVD;
        return item instanceof Magazine;
      });
    }

    if (criteria.title) {
      const normalizedTitle = criteria.title.trim().toLowerCase();
      matches = matches.filter(
        (item) => item.title.trim().toLowerCase() === normalizedTitle,
      );
    }

    if (criteria.author) {
      const normalizedAuthor = criteria.author.trim().toLowerCase();
      matches = matches.filter(
        (item) =>
          item instanceof Book &&
          item.author.trim().toLowerCase() === normalizedAuthor,
      );
    }

    if (criteria.release !== undefined) {
      matches = matches.filter(
        (item) =>
          item instanceof Book && item.release === Number(criteria.release),
      );
    }

    return matches;
  }

  findBorrowableOrThrow(
    target: BorrowableId | string | SearchCriteria,
  ): Borrowable {
    if (typeof target === 'number') {
      return this.findById(target);
    }

    const criteria: SearchCriteria =
      typeof target === 'string' ? { title: target } : target;

    if (!criteria.title) {
      throw new BadRequestException('Please provide a title');
    }

    const matches = this.findByCriteria(criteria);

    if (matches.length === 0) {
      throw new NotFoundException('No item matches that title');
    }

    if (matches.length > 1) {
      throw new BadRequestException(
        'More than one item matches please specify an author or release or choose an item by its ID',
      );
    }

    return matches[0];
  }

  remove(id: BorrowableId): void {
    this.findById(id);
    this.items.delete(id);
  }
}
