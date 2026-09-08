import { get } from 'node:http';

export async function GET() {
  const url = process.env.RECORDER_URL || 'http://127.0.0.1:9999/__recorder';
  const body = await new Promise<string>((resolve, reject) => {
    const req = get(url, res => {
      let acc = '';
      res.on('data', c => (acc += c));
      res.on('end', () => resolve(acc));
    });
    req.on('error', reject);
  });
  return new Response(JSON.stringify({ ok: true, body }), { headers: { 'content-type': 'application/json' } });
}
