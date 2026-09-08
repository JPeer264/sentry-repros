export const dynamic = 'force-dynamic';
export async function GET() {
  const res = await fetch('http://127.0.0.1:47311/__rec?from=outfetch');
  const body = await res.text();
  return Response.json({ ok: true, where: 'outfetch', recorder: body });
}
