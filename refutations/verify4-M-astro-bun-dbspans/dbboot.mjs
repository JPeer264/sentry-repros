// Alternative workaround: load the drivers first, so THEIR module-scope channel
// objects are the ones Sentry subscribes to and they stay reachable.
import 'mysql2';
import 'mysql';
await import('./sentry.server.config.mjs');
