import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader({ params }: LoaderFunctionArgs) {
  Sentry.setTag('probe_tag', `tag-${params.id}`);
  await new Promise(r => setTimeout(r, 300));
  Sentry.captureException(new Error(`iso-error-${params.id}`));
  return json({ ok: true });
}
export default function Iso() { return <div>iso</div>; }
