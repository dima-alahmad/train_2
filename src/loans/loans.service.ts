import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { BorrowablesService } from '../borrowables/borrowable.service.js';
import { UsersService } from '../users/users.service.js';

import { errorMessage } from '../library/library.helpers.js';

import { DEFAULT_LOAN_DAYS, LOAN_DAYS } from '../library/library.types.js';
import type {
  LoanPolicy,
  LoanRecord,
 BorrowableId,
  SearchCriteria,
  UserId,
} from '../library/library.types.js';

@Injectable()
export class LoansService {
  private readonly loans: LoanRecord[] = [];

  private readonly loanDays: LoanPolicy;

  constructor(
    private readonly borrowablesService: BorrowablesService,
    private readonly usersService: UsersService,
    @Optional() @Inject(LOAN_DAYS) loanDays?: number,
  ) {
    this.loanDays = loanDays ?? DEFAULT_LOAN_DAYS;
  }

  get activeLoans(): readonly LoanRecord[] {
    return this.loans;
  }

  async borrowAsync(
    userId: UserId,
    borrowableOrQuery: BorrowableId | string | SearchCriteria,
  ): Promise<LoanRecord> {
    try {
      console.log('[library] borrowAsync');
      const user = this.usersService.findById(userId);
      const item = this.borrowablesService.findBorrowableOrThrow(borrowableOrQuery);

      if (user.hasLoan(item.id)) {
        throw new BadRequestException(
          'User already borrowed a copy of this item',
          { errorCode: 'ALREADY_BORROWED' },
        );
      }

      item.borrow();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + this.loanDays);
      const loan: LoanRecord = [item.id, userId, dueDate];
      user.addLoan(item.id);
      this.loans.push(loan);
      await Promise.resolve();
      return loan;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Borrow failed: ${errorMessage(error)}`, {
        errorCode: 'BORROW_FAILED',
      });
    }
  }

  async returnAsync(
    userId: UserId,
    borrowableOrQuery: BorrowableId | string | SearchCriteria,
  ): Promise<void> {
    try {
      console.log('[library] returnAsync');
      const user = this.usersService.findById(userId);
      const item = this.borrowablesService.findBorrowableOrThrow(borrowableOrQuery);

      if (!user.hasLoan(item.id)) {
        throw new BadRequestException('This user does not have this item', {
          errorCode: 'LOAN_NOT_FOUND',
        });
      }

      item.returnItem();
      user.removeLoan(item.id);
      const index = this.loans.findIndex(
  ([loanBorrowableId, loanUserId]) =>
    loanBorrowableId === item.id && loanUserId === userId,
);
      if (index >= 0) this.loans.splice(index, 1);
      await Promise.resolve();
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Return failed: ${errorMessage(error)}`, {
        errorCode: 'RETURN_FAILED',
      });
    }
  }
}