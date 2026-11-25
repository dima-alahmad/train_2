import { ForbiddenException } from '@nestjs/common';
import { assertUserAccess } from './library.helpers.js';

describe('assertUserAccess', () => {
  it('allows members to access their own user data', () => {
    expect(() => assertUserAccess(7, 'member', 7)).not.toThrow();
  });

  it('rejects members who target another user', () => {
    expect(() => assertUserAccess(8, 'member', 7)).toThrow(
      ForbiddenException,
    );
  });

  it('rejects members without a valid token subject', () => {
    expect(() => assertUserAccess(7, 'member', undefined)).toThrow(
      ForbiddenException,
    );
  });

  it('allows admins to access another user', () => {
    expect(() => assertUserAccess(8, 'admin', 7)).not.toThrow();
  });
});
