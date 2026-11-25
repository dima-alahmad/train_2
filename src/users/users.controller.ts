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
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateUserDto, UpdateUserChangesDto } from '../library.dto.js';
import { UsersService } from './users.service.js';
import { DbIntPipe } from '../library/pipes/intpipe.js';
import { Roles } from '../library/guards/roles.decorator.js';
import { UpdateUserPipe } from '../library/pipes/update-user.pipe.js';
import { Public } from '../library/guards/public.decorator.js';
import {
  ActorRole,
  ActorUserId,
} from '../library/decorators/actor-role.decorator.js';
import type { UserRole } from '../library/library.types.js';
import { assertUserAccess } from '../library/library.helpers.js';

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
  findUser(
    @Param('id', DbIntPipe) id: number,
    @ActorRole() actorRole?: UserRole,
    @ActorUserId() actorUserId?: number,
  ) {
    assertUserAccess(id, actorRole, actorUserId);
    return this.usersService.findById(id);
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  createUser(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    userData: CreateUserDto,
  ) {
    return this.usersService.createUser(userData.name, userData.email);
  }

  @Patch(':id')
  @Roles(['admin'])
  updateUserChanges(
    @Param('id', DbIntPipe) id: number,
    @Body(UpdateUserPipe) changes: UpdateUserChangesDto,
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