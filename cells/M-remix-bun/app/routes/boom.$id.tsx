import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params }: LoaderFunctionArgs) {
  throw new Error(`probe-loader-boom-${params.id}`);
}
export default function Boom() {
  return <div>boom</div>;
}
