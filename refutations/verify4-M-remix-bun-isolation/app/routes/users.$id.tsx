import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params }: LoaderFunctionArgs) {
  return { id: params.id };
}

export default function User() {
  return <p>user</p>;
}
