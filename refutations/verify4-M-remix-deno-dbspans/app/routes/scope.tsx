import * as Sentry from '@sentry/remix';
export async function loader() {
  await new Promise(r => setTimeout(r, 50));
  return {
    tags: (Sentry.getIsolationScope() as any).getScopeData().tags,
    trace: Sentry.getTraceData(),
  };
}
export default function S() { return <div>scope</div>; }
