import http from 'node:http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const rec = new URL(req.url).searchParams.get('rec')!;
  const target = new URL(`${rec}?via=nodehttp`);
  const status = await new Promise<number>((resolve, reject) => {
    const r = http.get(
      { hostname: target.hostname, port: target.port, path: `${target.pathname}${target.search}` },
      res => {
        res.resume();
        res.on('end', () => resolve(res.statusCode || 0));
      },
    );
    r.on('error', reject);
  });
  return Response.json({ status });
}
