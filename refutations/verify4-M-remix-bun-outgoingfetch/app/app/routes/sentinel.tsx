import { json } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(3000);
  return json({ ok: true });
}

export default function Sentinel() {
  return <p>sentinel</p>;
}
