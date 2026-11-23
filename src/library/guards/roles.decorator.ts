import { Reflector } from '@nestjs/core';
import type { UserRoles } from '../../library/library.types.js';

export const Roles = Reflector.createDecorator<UserRoles>();