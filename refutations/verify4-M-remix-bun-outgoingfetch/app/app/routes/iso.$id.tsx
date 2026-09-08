import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader({ params }: LoaderFunctionArgs) {
  Sentry.setTag('probe_tag', `tag-${params.id}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  Sentry.captureException(new Error(`iso-error-${params.id}`));
  return json({ id: params.id });
}

export default function Iso() {
  return <p>iso</p>;
}
