import { withServerActionInstrumentation } from '@sentry/solidstart';
import { createAsync } from '@solidjs/router';

async function boomAction() {
  'use server';
  return withServerActionInstrumentation('boomAction', async () => {
    throw new Error('probe-server-action-error');
  });
}

export default function ServerError() {
  const data = createAsync(() => boomAction());
  return <pre>{JSON.stringify(data())}</pre>;
}
