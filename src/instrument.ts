/**
 * Sentry bootstrap for the NestJS backend.
 *
 * MUST be imported before any other module (especially before AppModule and
 * any HTTP framework code) so that Sentry can instrument Node's http module
 * and automatically capture incoming requests.
 *
 * Activated only when SENTRY_DSN is provided (via AWS Secrets Manager in
 * production or a local .env in development). Without a DSN the module is
 * a no-op, so local dev and unit tests are unaffected.
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION ?? process.env.CIRCLE_SHA1 ?? 'dev',
    integrations: [nodeProfilingIntegration()],
    // Keep sampling conservative in production to control Sentry quota.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
  });
  // eslint-disable-next-line no-console
  console.log(
    `[Sentry] initialised for env=${process.env.NODE_ENV ?? 'development'}`,
  );
}
