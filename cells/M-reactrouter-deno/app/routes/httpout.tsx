import http from 'node:http';
import type { Route } from './+types/httpout';

export async function loader({ request }: Route.LoaderArgs) {
  const target = new URL(request.url).searchParams.get('target') as string;
  const status = await new Promise<number>((resolve, reject) => {
    const req = http.get(target, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', reject);
  });
  return { ok: 'http', status };
}

export default function HttpOut({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
