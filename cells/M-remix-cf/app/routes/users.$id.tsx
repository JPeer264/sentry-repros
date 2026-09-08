import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ params }: LoaderFunctionArgs) {
  return new Response(JSON.stringify({ id: params.id }), {
    headers: { 'content-type': 'application/json' },
  });
}
