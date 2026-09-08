import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export const loader = ({ params }: LoaderFunctionArgs) => {
  throw new Response(`remix-cf thrown response ${params.id}`, { status: 500 });
};

export default function BoomResp() {
  return <h1>boomresp</h1>;
}
