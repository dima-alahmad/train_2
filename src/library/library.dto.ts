import type { BorrowableId, SearchCriteria, UserId } from './library.types.js';

export class SearchBorrowableQueryDto implements SearchCriteria {
  title?: string;
  author?: string;
  release?: number;
}

export class CreateBorrowableDto {
  kind?: 'book' | 'dvd' | 'magazine';
  title!: string;
  totalCopies!: number;
  pages?: number;
  author?: string;
  yearOfPublication?: number | string;
  release?: number;
  minutes?: number;
}

export class UpdateUserChangesDto {
  name?: string;
  email?: string;
}

export class LoanActionDto {
  userId!: UserId;
  mediaOrQuery!: BorrowableId | string | SearchCriteria;
}