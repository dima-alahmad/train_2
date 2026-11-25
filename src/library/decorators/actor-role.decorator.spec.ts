import { parseActorUserId } from './actor-role.decorator.js';

describe('parseActorUserId', () => {
  it('accepts a positive numeric JWT subject', () => {
    expect(parseActorUserId(7)).toBe(7);
    expect(parseActorUserId('7')).toBe(7);
  });

  it('rejects invalid or unsafe JWT subjects', () => {
    expect(parseActorUserId(undefined)).toBeUndefined();
    expect(parseActorUserId('0')).toBeUndefined();
    expect(parseActorUserId('not-a-user-id')).toBeUndefined();
    expect(parseActorUserId('9007199254740992')).toBeUndefined();
  });
});
