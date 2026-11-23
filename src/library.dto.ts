export type CreateBorrowableDto =
  | {
      type: 'book';
      title: string;
      totalCopies?: number;
      author: string;
      pages?: number;
      yearOfPublication?: number;
      release?: number;
    }
  | {
      type: 'dvd';
      title: string;
      totalCopies?: number;
      minutes?: number;
    }
  | {
      type: 'magazine';
      title: string;
      totalCopies?: number;
      pages?: number;
    };

export class UpdateBorrowableDto {
  title?: string;
  totalCopies?: number;
  author?: string;
  pages?: number;
  minutes?: number;
  yearOfPublication?: number;
  release?: number;
}

export class UpdateUserChangesDto {
  name?: string;
  email?: string;
  active?: boolean;
}

export class SearchBorrowableQueryDto {
  id?: number;
  title?: string;
  type?: 'book' | 'dvd' | 'magazine';
  author?: string;
  release?: number;
}

export class LoanActionDto {
  userId: number;
  borrowableIdentifier: string;
}