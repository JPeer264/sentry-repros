import diagnosticsChannel from 'node:diagnostics_channel';

export const dynamic = 'force-dynamic';

export async function GET() {
  const names = ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect'];
  const state: Record<string, unknown> = {};
  for (const n of names) {
    const tc = diagnosticsChannel.tracingChannel(n) as unknown as Record<string, any>;
    state[n] = {
      agg: tc.hasSubscribers,
      start: tc.start?.hasSubscribers,
      end: tc.end?.hasSubscribers,
      asyncStart: tc.asyncStart?.hasSubscribers,
    };
  }
  return Response.json({ bun: (process.versions as any).bun, state });
}
