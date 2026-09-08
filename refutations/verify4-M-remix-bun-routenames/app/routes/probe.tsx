import * as Sentry from '@sentry/remix';

export async function loader() {
  const active = Sentry.getActiveSpan();
  const root = active ? Sentry.getRootSpan(active) : undefined;
  return {
    hasActiveSpan: !!active,
    activeName: active ? Sentry.spanToJSON(active).name : null,
    rootName: root ? Sentry.spanToJSON(root).name : null,
    rootOp: root ? Sentry.spanToJSON(root).op : null,
    traceData: Sentry.getTraceData(),
  };
}

export default function Probe() {
  return <div>probe</div>;
}
