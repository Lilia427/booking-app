import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken') as { verify: jest.Mock; sign: jest.Mock };

import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { TokenBlacklistService } from '../token-blacklist.service';

const makeContext = (headers: Record<string, string | undefined>) => {
  const request: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({
      getRequest: <T>() => request as T,
    }),
  } as unknown as ExecutionContext;
};

describe('AdminJwtAuthGuard', () => {
  let guard: AdminJwtAuthGuard;
  let blacklist: jest.Mocked<TokenBlacklistService>;

  beforeEach(() => {
    blacklist = {
      revoke: jest.fn(),
      isRevoked: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<TokenBlacklistService>;
    guard = new AdminJwtAuthGuard(blacklist);
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  it('throws when Authorization header is missing', () => {
    const ctx = makeContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when scheme is not Bearer', () => {
    const ctx = makeContext({ authorization: 'Basic abc' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when token part is missing', () => {
    const ctx = makeContext({ authorization: 'Bearer ' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when token has been revoked (blacklisted)', () => {
    blacklist.isRevoked.mockReturnValue(true);
    const ctx = makeContext({ authorization: 'Bearer revoked-token' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws InternalServerErrorException when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    const ctx = makeContext({ authorization: 'Bearer tkn' });
    expect(() => guard.canActivate(ctx)).toThrow(InternalServerErrorException);
  });

  it('throws when jwt.verify rejects (invalid/expired)', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const ctx = makeContext({ authorization: 'Bearer bad.token.sig' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when payload is a string (opaque JWT)', () => {
    jwt.verify.mockReturnValue('opaque-string');
    const ctx = makeContext({ authorization: 'Bearer opaque' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when payload.id is not a number', () => {
    jwt.verify.mockReturnValue({ id: 'not-a-number', email: 'a@a.com' });
    const ctx = makeContext({ authorization: 'Bearer malformed' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('attaches user and authToken to request on success', () => {
    const payload = { id: 42, email: 'a@a.com', name: 'Alice' };
    jwt.verify.mockReturnValue(payload);

    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer valid.jwt.token' },
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: <T>() => request as T,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret');
    expect(request['user']).toEqual(payload);
    expect(request['authToken']).toBe('valid.jwt.token');
  });
});
