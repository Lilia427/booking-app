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
