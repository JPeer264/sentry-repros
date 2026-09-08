export const dynamic = 'force-dynamic';

export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  return Response.json({ id });
}
