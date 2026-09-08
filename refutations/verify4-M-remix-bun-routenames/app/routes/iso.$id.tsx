import type { LoaderFunctionArgs } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  Sentry.setTag('probe_tag', `tag-${id}`);
  await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
  Sentry.captureException(new Error(`iso-error-${id}`));
  return { id };
}

export default function Iso() {
  return <div>iso</div>;
}
