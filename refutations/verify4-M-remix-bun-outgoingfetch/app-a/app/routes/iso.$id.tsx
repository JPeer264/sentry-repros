import * as Sentry from '@sentry/remix';

export async function loader({ params, request }: { params: { id?: string }; request: Request }) {
  Sentry.setTag('probe_tag', `tag-${params.id}`);
  await new Promise(r => setTimeout(r, 250));
  Sentry.captureException(new Error(`iso-error-${params.id}`));
  return { id: params.id, incoming: request.headers.get('sentry-trace') };
}

export default function Iso() {
  return <div>iso</div>;
}
