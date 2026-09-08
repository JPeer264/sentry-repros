import type { LoaderFunctionArgs } from '@remix-run/server-runtime';

export async function loader({ request }: LoaderFunctionArgs) {
  const kind = new URL(request.url).searchParams.get('kind') || 'fetch';
  const url = `http://127.0.0.1:${process.env.RECORDER_PORT}/${kind}`;
  try {
    if (kind === 'fetch') {
      const res = await fetch(url);
      return { kind, body: await res.text() };
    }
    if (kind === 'post') {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hello: 'world' }) });
      return { kind, body: await res.text() };
    }
    if (kind === 'reqobj') {
      const res = await fetch(new Request(url));
      return { kind, body: await res.text() };
    }
    if (kind === 'ext') {
      const res = await fetch('https://example.com/');
      return { kind, body: `status ${res.status}` };
    }
    if (kind === 'undici') {
      const { fetch: undiciFetch } = await import('undici');
      const res = await undiciFetch(url);
      return { kind, body: await res.text() };
    }
    if (kind === 'axios') {
      const { default: axios } = await import('axios');
      const res = await axios.get(url);
      return { kind, body: String(res.data) };
    }
    if (kind === 'nodehttp') {
      const http = await import('node:http');
      const body: string = await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          let d = '';
          res.on('data', c => (d += c));
          res.on('end', () => resolve(d));
        });
        req.on('error', reject);
      });
      return { kind, body };
    }
    return { kind, body: 'unknown kind' };
  } catch (e) {
    return { kind, body: `ERR ${(e as Error).message}` };
  }
}

export default function Out() {
  return <div>out</div>;
}
