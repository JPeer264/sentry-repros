import { useLoaderData } from '@remix-run/react';

export function loader({ params }: { params: { id?: string } }) {
  return { id: params.id };
}

export default function User() {
  const data = useLoaderData<typeof loader>();
  return <div>user {data.id}</div>;
}
