import { withServerActionInstrumentation } from '@sentry/solidstart';
import { createAsync } from '@solidjs/router';

const getPrefecture = async () => {
  'use server';
  return await withServerActionInstrumentation('getPrefecture', () => {
    throw new Error('solidstart-deno server action error');
  });
};

export default function ServerErrorPage() {
  const data = createAsync(() => getPrefecture());
  return <div>Prefecture: {data()?.prefecture}</div>;
}
