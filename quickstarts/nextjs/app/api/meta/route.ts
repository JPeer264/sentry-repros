import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export function GET() {
  const client = Sentry.getClient();
  const o = (client?.getOptions() ?? {}) as Record<string, unknown>;
  const md = (o._metadata as { sdk?: unknown } | undefined)?.sdk;
  return Response.json({
    initialized: !!client,
    sdk: md,
    integrations: ((o.integrations as { name: string }[]) || []).map((i) => i.name),
    dsn: o.dsn,
    tracesSampleRate: o.tracesSampleRate,
    release: o.release,
    environment: o.environment,
    node: process.version,
    nextRuntime: process.env.NEXT_RUNTIME,
  });
}
