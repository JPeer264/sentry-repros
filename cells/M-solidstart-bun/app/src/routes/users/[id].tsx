import { withServerActionInstrumentation } from '@sentry/solidstart';
import { createAsync, useParams } from '@solidjs/router';

async function getUser(id: string) {
  'use server';
  return withServerActionInstrumentation('getUser', async () => ({ id, name: `user-${id}` }));
}

export default function User() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return <pre>{JSON.stringify(user())}</pre>;
}
