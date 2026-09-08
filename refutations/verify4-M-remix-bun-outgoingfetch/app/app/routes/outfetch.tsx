import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  const recPort = new URL(request.url).searchParams.get('rec');
  const res = await fetch(`http://127.0.0.1:${recPort}/rec`);
  return json({ ok: res.status });
}

export default function OutFetch() {
  return <p>outfetch</p>;
}
