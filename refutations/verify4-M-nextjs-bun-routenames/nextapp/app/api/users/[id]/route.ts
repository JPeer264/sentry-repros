import * as Sentry from '@sentry/nextjs';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  Sentry.captureMessage(`users-probe-${id}`);
  return Response.json({ id });
}
