import * as Sentry from '@sentry/cloudflare';
import type { Route } from './+types/users.$id';

export function loader({ params }: Route.LoaderArgs) {
  const span = Sentry.getActiveSpan();
  const root = span ? Sentry.getRootSpan(span) : undefined;
  return {
    id: params.id,
    hasActiveSpan: !!span,
    rootSpanName: root ? Sentry.spanToJSON(root).description : null,
    traceId: root ? Sentry.spanToJSON(root).trace_id : null,
  };
}

export default function User({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
