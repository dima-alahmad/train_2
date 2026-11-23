import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UpdateUserChangesDto } from '../library.dto.js';
import { UsersService } from './users.service.js';
import { DbIntPipe } from '../library/pipes/intpipe.js';
import { Roles } from '../library/guards/roles.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(['admin'])
  findAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(['admin', 'member'])
  findUser(@Param('id', DbIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() userData: { name: string; email: string }) {
    return this.usersService.createUser(userData.name, userData.email);
  }

  @Patch(':id')
  @Roles(['admin'])
  updateUserChanges(
    @Param('id', DbIntPipe) id: number,
    @Body() changes: UpdateUserChangesDto,
  ) {
    return this.usersService.updateChanges(id, changes);
  }

  @Delete(':id')
  @Roles(['admin'])
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @Param('id', DbIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.usersService.remove(id);
    res.setHeader('X-Removed-User-Id', String(id));
  }
}