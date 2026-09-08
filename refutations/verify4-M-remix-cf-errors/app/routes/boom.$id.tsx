import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export const loader = ({ params }: LoaderFunctionArgs) => {
  throw new Error(`remix-cf loader error ${params.id}`);
};

export default function Boom() {
  return <h1>boom</h1>;
}
