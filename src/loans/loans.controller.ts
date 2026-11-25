import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { LoanActionDto, ReturnLoanDto } from '../library.dto.js';

import type { UserRole } from '../library/library.types.js';
import { LoansService } from './loans.service.js';
import { DbIntPipe } from '../library/pipes/intpipe.js';
import { Roles } from '../library/guards/roles.decorator.js';
import {
  ActorRole,
  ActorUserId,
} from '../library/decorators/actor-role.decorator.js';
import { assertUserAccess } from '../library/library.helpers.js';

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
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    loanDto: LoanActionDto,
    @ActorRole() actorRole?: UserRole,
    @ActorUserId() actorUserId?: number,
  ) {
    assertUserAccess(loanDto.userId, actorRole, actorUserId);

    const loan = await this.loansService.borrowAsync(
      loanDto.userId,
      loanDto.borrowableOrQuery,
    );

    if (actorRole === 'admin') {
      return {
        message: 'Loan request completed',
        loan,
        adminMeta: {
          processedBy: 'admin',
          totalActiveLoans: this.loansService.activeLoans.length,
        },
      };
    }

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
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: ReturnLoanDto,
    @ActorRole() actorRole?: UserRole,
    @ActorUserId() actorUserId?: number,
  ) {
    assertUserAccess(body.userId, actorRole, actorUserId);

    await this.loansService.returnAsync(
      body.userId,
      body.query ?? BorrowableId,
    );
    return {
      message: `Item #${BorrowableId} returned for user #${body.userId}`,
    };
  }
}