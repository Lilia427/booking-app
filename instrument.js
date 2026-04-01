import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://75ae6784f88e01943cffaf124060a491@o4511147327029248.ingest.de.sentry.io/4511147365105744",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  enableLogs: true,
  sendDefaultPii: true,
});
