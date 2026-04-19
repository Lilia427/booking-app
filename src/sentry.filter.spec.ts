import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry = require('@sentry/node') as { captureException: jest.Mock };

import { SentryExceptionFilter } from './sentry.filter';

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;

  beforeEach(() => {
    // BaseExceptionFilter requires an httpAdapter; stub the two methods it uses.
    const httpAdapter = {
      reply: jest.fn(),
      isHeadersSent: jest.fn().mockReturnValue(false),
      end: jest.fn(),
    } as unknown as Parameters<typeof SentryExceptionFilter.prototype.catch>[1];

    filter = new SentryExceptionFilter(httpAdapter as any);
    // Prevent BaseExceptionFilter from actually writing to HTTP in tests.
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(filter)), 'catch')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const makeHost = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/x' }),
        getResponse: () => ({}),
      }),
      getType: () => 'http',
    }) as unknown as ArgumentsHost;

  it('sends non-HttpException (unhandled error) to Sentry', () => {
    filter.catch(new Error('boom'), makeHost());
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('sends 5xx HttpException to Sentry', () => {
    const err = new HttpException('db down', HttpStatus.INTERNAL_SERVER_ERROR);
    filter.catch(err, makeHost());
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('does NOT send 400 BadRequestException to Sentry', () => {
    filter.catch(new BadRequestException('bad input'), makeHost());
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('does NOT send 401 UnauthorizedException to Sentry', () => {
    filter.catch(new UnauthorizedException(), makeHost());
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('does NOT send 404 NotFoundException to Sentry', () => {
    filter.catch(new NotFoundException(), makeHost());
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
