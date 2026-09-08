import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ params }: LoaderFunctionArgs) {
  throw new Error(`remix-cf loader error ${params.id}`);
}
