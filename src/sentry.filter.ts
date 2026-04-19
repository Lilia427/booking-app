import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * Global filter that forwards unhandled and 5xx errors to Sentry while
 * preserving NestJS's default HTTP response handling via BaseExceptionFilter.
 *
 * 4xx client errors (validation, 401/403/404) are intentionally NOT sent —
 * they are expected and would pollute the issues dashboard.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    super.catch(exception, host);
  }
}
