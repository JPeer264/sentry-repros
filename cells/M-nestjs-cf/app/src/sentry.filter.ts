import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/cloudflare';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest();
    if (typeof req?.url === 'string' && req.url.startsWith('/error-filtered')) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
