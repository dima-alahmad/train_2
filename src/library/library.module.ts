import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BorrowablesController } from '../borrowables/borrowables.controller.js';
import { UsersController } from '../users/users.controller.js';
import { LoansController } from '../loans/loans.controller.js';
import { BorrowablesService } from '../borrowables/borrowable.service.js';
import { UsersService } from '../users/users.service.js';
import { LoansService } from '../loans/loans.service.js';
import { DEFAULT_LOAN_DAYS, LOAN_DAYS } from './library.types.js';
import { libraryMiddleware } from './middleware/libraryMiddleware.js';
import { RolesGuard } from './guards/roles.js';
import { RequestTimingInterceptor } from './interceptors/time.interceptor.js';
import { ResponseEnvelopeInterceptor } from './interceptors/responseenvelope.interceptor.js';

@Module({
  controllers: [BorrowablesController, UsersController, LoansController],
  providers: [
    BorrowablesService,
    UsersService,
    LoansService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class LibraryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(libraryMiddleware)
      .forRoutes(BorrowablesController, UsersController, LoansController);
  }

  static forRoot(loanDays: number = DEFAULT_LOAN_DAYS): DynamicModule {
    return {
      module: LibraryModule,
      providers: [
        {
          provide: LOAN_DAYS,
          useValue: loanDays,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: RequestTimingInterceptor,
        },
      ],
    };
  }
}