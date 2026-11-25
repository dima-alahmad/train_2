import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { LoansController } from '../src/loans/loans.controller.js';
import { LoansService } from '../src/loans/loans.service.js';
import { UsersController } from '../src/users/users.controller.js';
import { UsersService } from '../src/users/users.service.js';
import { JwtAuthGuard } from '../src/library/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/library/guards/roles.js';
import type {
  BorrowableId,
  LoanRecord,
  SearchCriteria,
  UserId,
} from '../src/library/library.types.js';

const JWT_SECRET = 'ownership-test-secret';
const originalJwtSecret = process.env.JWT_SECRET;

describe('HTTP user ownership authorization', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let ownUserId: UserId;
  let otherUserId: UserId;
  let borrowCalls: Array<[UserId, BorrowableId | string | SearchCriteria]>;
  let returnCalls: Array<[UserId, BorrowableId | string | SearchCriteria]>;

  async function createToken(payload: {
    sub?: string;
    role?: string;
    roles?: string[];
  }): Promise<string> {
    return jwtService.signAsync(payload);
  }

  function requestWithToken(
    token: string,
    method: 'get' | 'post' | 'patch',
    path: string,
  ) {
    return request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    jwtService = new JwtService({ secret: JWT_SECRET });

    const usersService = new UsersService();
    ownUserId = usersService.createUser('Owner', 'owner@example.com').id;
    otherUserId = usersService.createUser('Other', 'other@example.com').id;

    borrowCalls = [];
    returnCalls = [];
    const loansService = {
      activeLoans: [] as LoanRecord[],
      borrowAsync: async (
        userId: UserId,
        target: BorrowableId | string | SearchCriteria,
      ): Promise<LoanRecord> => {
        borrowCalls.push([userId, target]);
        return [typeof target === 'number' ? target : 1, userId, new Date()];
      },
      returnAsync: async (
        userId: UserId,
        target: BorrowableId | string | SearchCriteria,
      ): Promise<void> => {
        returnCalls.push([userId, target]);
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController, LoansController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: LoansService, useValue: loansService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalGuards(
      new JwtAuthGuard(jwtService),
      new RolesGuard(new Reflector()),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  beforeEach(() => {
    borrowCalls.length = 0;
    returnCalls.length = 0;
  });

  it('allows a member to view their own profile', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(
      token,
      'get',
      `/users/${ownUserId}`,
    );

    expect(response.status).toBe(200);
  });

  it('denies a member access to another profile', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(
      token,
      'get',
      `/users/${otherUserId}`,
    );

    expect(response.status).toBe(403);
  });

  it('allows an admin to view another profile', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'admin',
    });

    const response = await requestWithToken(
      token,
      'get',
      `/users/${otherUserId}`,
    );

    expect(response.status).toBe(200);
  });

  it('does not let x-user-role override a member token', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await request(app.getHttpServer())
      .get(`/users/${otherUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-role', 'admin');

    expect(response.status).toBe(403);
  });

  it('allows a member to borrow for themselves', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(token, 'post', '/loans/borrow')
      .send({ userId: ownUserId, borrowableOrQuery: 1 });

    expect(response.status).toBe(201);
    expect(borrowCalls).toHaveLength(1);
    expect(borrowCalls[0][0]).toBe(ownUserId);
  });

  it('denies a member borrowing for another user', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(token, 'post', '/loans/borrow')
      .send({ userId: otherUserId, borrowableOrQuery: 1 });

    expect(response.status).toBe(403);
    expect(borrowCalls).toHaveLength(0);
  });

  it('does not let x-user-role grant cross-user borrowing', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await request(app.getHttpServer())
      .post('/loans/borrow')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-role', 'admin')
      .send({ userId: otherUserId, borrowableOrQuery: 1 });

    expect(response.status).toBe(403);
    expect(borrowCalls).toHaveLength(0);
  });

  it('allows an admin to borrow for another user', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'admin',
    });

    const response = await requestWithToken(token, 'post', '/loans/borrow')
      .send({ userId: otherUserId, borrowableOrQuery: 1 });

    expect(response.status).toBe(201);
    expect(borrowCalls[0][0]).toBe(otherUserId);
  });

  it('allows a member to return their own loan', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(
      token,
      'patch',
      '/loans/1/return',
    ).send({ userId: ownUserId });

    expect(response.status).toBe(200);
    expect(returnCalls).toHaveLength(1);
    expect(returnCalls[0][0]).toBe(ownUserId);
  });

  it('denies a member returning another user loan', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(
      token,
      'patch',
      '/loans/1/return',
    ).send({ userId: otherUserId });

    expect(response.status).toBe(403);
    expect(returnCalls).toHaveLength(0);
  });

  it('allows an admin to return another user loan', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'admin',
    });

    const response = await requestWithToken(
      token,
      'patch',
      '/loans/1/return',
    ).send({ userId: otherUserId });

    expect(response.status).toBe(200);
    expect(returnCalls[0][0]).toBe(otherUserId);
  });

  it('denies members whose token has no subject', async () => {
    const token = await createToken({ role: 'member' });

    const response = await requestWithToken(
      token,
      'get',
      `/users/${ownUserId}`,
    );

    expect(response.status).toBe(403);
  });

  it('rejects missing and invalid bearer tokens', async () => {
    const missingTokenResponse = await request(app.getHttpServer()).get(
      `/users/${ownUserId}`,
    );
    const invalidTokenResponse = await request(app.getHttpServer())
      .get(`/users/${ownUserId}`)
      .set('Authorization', 'Bearer invalid-token');

    expect(missingTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.status).toBe(401);
  });

  it('rejects a string userId in the JSON body', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(token, 'post', '/loans/borrow')
      .send({ userId: String(ownUserId), borrowableOrQuery: 1 });

    expect(response.status).toBe(400);
    expect(borrowCalls).toHaveLength(0);
  });

  it('rejects unexpected loan fields instead of trusting them', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
    });

    const response = await requestWithToken(token, 'post', '/loans/borrow')
      .send({
        userId: ownUserId,
        borrowableOrQuery: 1,
        role: 'admin',
      });

    expect(response.status).toBe(400);
    expect(borrowCalls).toHaveLength(0);
  });

  it('honors an admin role present in a verified roles claim', async () => {
    const token = await createToken({
      sub: String(ownUserId),
      role: 'member',
      roles: ['admin'],
    });

    const response = await requestWithToken(
      token,
      'get',
      `/users/${otherUserId}`,
    );

    expect(response.status).toBe(200);
  });
});
