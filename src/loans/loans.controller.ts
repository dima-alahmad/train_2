import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoanActionDto } from '../library.dto.js';
import type { BorrowableId, SearchCriteria, UserId } from '../library/library.types.js';
import type { UserRole } from '../library/library.types.js';
import { LoansService } from './loans.service.js';
import { DbIntPipe } from '../library/pipes/intpipe.js';
import { Roles } from '../library/guards/roles.decorator.js';
import { ActorRole } from '../library/decorators/actor-role.decorator.js';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @Roles(['admin'])
  getLoansHistory() {
    return this.loansService.activeLoans;
  }

  @Post('borrow')
  @Roles(['admin', 'member'])
  @HttpCode(HttpStatus.CREATED)
  async borrow(
    @Body()
    loanDto: LoanActionDto & {
      userId: UserId;
      borrowableOrQuery: BorrowableId | string | SearchCriteria;
    },
    @ActorRole() actorRole?: UserRole,
  ) {
    const loan = await this.loansService.borrowAsync(
      loanDto.userId,
      loanDto.borrowableOrQuery,
    );
    void actorRole;
    return {
      message: 'Loan request completed',
      loan,
    };
  }

  @Patch(':id/return')
  @Roles(['admin', 'member'])
  @HttpCode(HttpStatus.OK)
  async returnBorrowable(
    @Param('id', DbIntPipe) BorrowableId: number,
    @Body() body: { userId: UserId; query?: string | SearchCriteria },
    @ActorRole() actorRole?: UserRole,
  ) {
    await this.loansService.returnAsync(body.userId, body.query ?? BorrowableId);
    void actorRole;
    return {
      message: `Item #${BorrowableId} returned for user #${body.userId}`,
    };
  }
}