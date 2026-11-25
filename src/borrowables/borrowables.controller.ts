import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  SearchBorrowableQueryDto,
  type CreateBorrowableDto,
  type UpdateBorrowableDto,
} from '../library.dto.js';

import { BorrowablesService } from './borrowable.service.js';
import { DbIntPipe } from '../library/pipes/intpipe.js';
import { OptionalPublicationYear } from '../library/pipes/publication-yearpipe.js';
import { Roles } from '../library/guards/roles.decorator.js';
import { Public } from '../library/guards/public.decorator.js';

@Controller('borrowables')
export class BorrowablesController {
  constructor(private readonly borrowablesService: BorrowablesService) {}

  @Get()
  @Public()
  findByCriteria(@Query() criteria: SearchBorrowableQueryDto) {
    return this.borrowablesService.findByCriteria(criteria);
  }

  @Get(':id')
  findOne(@Param('id', DbIntPipe) id: number) {
    return this.borrowablesService.findById(id);
  }

  @Post()
  @Roles(['admin'])
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createBorrowableDto: CreateBorrowableDto,
    @OptionalPublicationYear() yearOfPublication?: number,
  ) {
    const payload =
      yearOfPublication !== undefined
        ? { ...createBorrowableDto, yearOfPublication }
        : createBorrowableDto;

    return this.borrowablesService.create(payload);
  }

  @Put(':id')
  @Roles(['admin'])
  replace(
    @Param('id', DbIntPipe) id: number,
    @Body() createBorrowableDto: CreateBorrowableDto,
    @OptionalPublicationYear() yearOfPublication?: number,
  ) {
    const payload =
      yearOfPublication !== undefined
        ? { ...createBorrowableDto, yearOfPublication }
        : createBorrowableDto;

    return this.borrowablesService.replace(id, payload);
  }

  @Patch(':id')
  @Roles(['admin'])
  updatePartial(
    @Param('id', DbIntPipe) id: number,
    @Body() partialData: UpdateBorrowableDto,
    @OptionalPublicationYear() yearOfPublication?: number,
  ) {
    const payload =
      yearOfPublication !== undefined
        ? { ...partialData, yearOfPublication }
        : partialData;

    return this.borrowablesService.update(id, payload);
  }

  @Delete(':id')
  @Roles(['admin'])
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', DbIntPipe) id: number) {
    this.borrowablesService.remove(id);
  }
}
