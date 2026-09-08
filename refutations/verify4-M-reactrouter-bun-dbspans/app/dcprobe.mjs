import { tracingChannel } from 'node:diagnostics_channel';
import * as Sentry from '@sentry/react-router';
for (const n of ['mysql2:query', 'mysql2:execute']) {
  tracingChannel(n).subscribe({
    start: () => console.log('[dcprobe] start', n, 'activeSpan=', !!Sentry.getActiveSpan()),
    asyncStart: () => console.log('[dcprobe] asyncStart', n),
  });
}
