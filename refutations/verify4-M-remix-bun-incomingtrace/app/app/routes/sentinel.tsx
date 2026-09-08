import { json } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader() {
  Sentry.captureMessage('sentinel');
  return json({ ok: true });
}
export default function S() { return <div>sentinel</div>; }
