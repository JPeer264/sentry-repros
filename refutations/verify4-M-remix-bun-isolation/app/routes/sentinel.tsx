import * as Sentry from '@sentry/remix';

export async function loader() {
  Sentry.captureException(new Error('sentinel'));
  return { ok: true };
}

export default function S() {
  return <p>sentinel</p>;
}
