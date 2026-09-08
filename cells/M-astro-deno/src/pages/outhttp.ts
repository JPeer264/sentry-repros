import type { APIRoute } from 'astro';
import http from 'node:http';

const sinkPort = globalThis.Deno?.env.get('SINK_PORT') ?? '47312';

export const GET: APIRoute = async () => {
  const body = await new Promise<string>((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: Number(sinkPort), path: '/rec?from=node-http', method: 'GET' },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve(d));
      },
    );
    req.on('error', reject);
    req.end();
  });
  return new Response(body, { headers: { 'content-type': 'application/json' } });
};
