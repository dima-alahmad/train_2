import type { Book } from './library.models.js';

export type BorrowableId = number;
export type UserId = number;
export type UserRole = 'admin' | 'member';
export type UserRoles = UserRole[];
export type LoanRecord = [BorrowableId, UserId, Date];
export type UserChanges = { [K in 'name' | 'email']?: string };


export interface SearchCriteria {
  id?: number;
  title?: string;
  type?: 'book' | 'dvd' | 'magazine';
  author?: string;
  release?: number;
}
export const DEFAULT_LOAN_DAYS = 14;
export type LoanPolicy = number;
export const LOAN_DAYS = 'LOAN_DAYS';
