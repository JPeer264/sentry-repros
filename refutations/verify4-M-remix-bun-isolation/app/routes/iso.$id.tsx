import type { LoaderFunctionArgs } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  Sentry.setTag('probe_tag', `tag-${id}`);
  await new Promise(r => setTimeout(r, 300 + Math.floor(Math.random() * 200)));
  Sentry.captureException(new Error(`iso-error-${id}`));
  await new Promise(r => setTimeout(r, 50));
  return { id };
}

export default function Iso() {
  return <p>iso</p>;
}
