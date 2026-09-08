import * as Sentry from '@sentry/remix';

export async function loader() {
  Sentry.captureMessage('sentinel');
  return { ok: true };
}

export default function S() {
  return <div>sentinel</div>;
}
