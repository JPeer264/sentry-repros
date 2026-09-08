import * as http from 'node:http';
export const dynamic = 'force-dynamic';
export async function GET() {
  const body: string = await new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:47311/__rec?from=outhttp', res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
  });
  return Response.json({ ok: true, where: 'outhttp', recorder: body });
}
