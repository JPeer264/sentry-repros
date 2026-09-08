import type { Route } from './+types/fetchout';

export async function loader({ request }: Route.LoaderArgs) {
  const target = new URL(request.url).searchParams.get('target') as string;
  const res = await fetch(target);
  return { ok: 'fetch', status: res.status };
}

export default function FetchOut({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
