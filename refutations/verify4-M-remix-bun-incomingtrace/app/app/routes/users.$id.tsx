import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ params }: LoaderFunctionArgs) {
  return json({ id: params.id });
}
export default function User() {
  const data = useLoaderData<typeof loader>();
  return <div>user {data.id}</div>;
}
