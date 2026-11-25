import { Transform } from 'class-transformer';
import { Allow, IsDefined, IsInt, IsOptional, Min } from 'class-validator';
import type { BorrowableId, SearchCriteria } from './library/library.types.js';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Matches(/^(?!\d+$).+$/, {
    message: 'Name cannot consist only of numbers',
  })
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;
}

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
  @IsInt({ message: 'userId must be a number' })
  @Min(1)
  userId!: number;

  @IsDefined()
  borrowableOrQuery!: BorrowableId | string | SearchCriteria;
}

export class ReturnLoanDto {
  @IsInt({ message: 'userId must be a number' })
  @Min(1)
  userId!: number;

  @IsOptional()
  @Allow()
  query?: string | SearchCriteria;
}