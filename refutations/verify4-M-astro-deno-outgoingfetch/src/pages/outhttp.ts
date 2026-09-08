import http from 'node:http';
export const prerender = false;
export async function GET() {
  const body = await new Promise<string>((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${process.env.REC_PORT}/rec?via=http`, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
  });
  return new Response(JSON.stringify({ via: 'http', body }), { headers: { 'content-type': 'application/json' } });
}
