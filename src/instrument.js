import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.experimentalUseDiagnosticsChannelInjection();
Sentry.init({
  dsn: 'https://0299849066e3bcf4626b214897b6c17f@o447951.ingest.us.sentry.io/4510555608449024',
  debug: true,
  tracesSampleRate: 1,
  integrations: [nodeProfilingIntegration()],
  profileSessionSampleRate: 1,
  profileLifecycle: 'trace',
  registerEsmLoaderHooks: false,
});
