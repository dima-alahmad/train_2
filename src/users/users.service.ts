import { ConflictException, Injectable } from '@nestjs/common'; //import { User, UserChanges, UserId, findOrThrow } from '../library/library.models.js';
import { User } from '../library/library.models.js';
import { findOrThrow } from '../library/library.helpers.js';
import type { UserChanges, UserId } from '../library/library.types.js';
@Injectable()
export class UsersService {
  private readonly users = new Map<UserId, User>();

  registerUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  createUser(name: string, email: string): User {
    const user = new User(name, email);
    this.users.set(user.id, user);
    return user;
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  findById(id: UserId): User {
    return findOrThrow(this.users, id, 'User');
  }

  updateChanges(id: UserId, changes: UserChanges): User {
    const user = this.findById(id);
    user.update(changes);
    return user;
  }
  remove(id: UserId): void {
    const user = findOrThrow(this.users, id, 'User');

    if (user.hasActiveLoans()) {
      throw new ConflictException('Cannot delete a user with active loans');
    }

    this.users.delete(id);
  }
}
