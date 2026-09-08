// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { mount, StartClient } from '@solidjs/start/client';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: 'http://127.0.0.1:53817/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});

mount(() => <StartClient />, document.getElementById('app')!);
