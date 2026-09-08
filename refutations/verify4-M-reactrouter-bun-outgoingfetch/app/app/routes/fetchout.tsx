import type { Route } from "./+types/fetchout";

export async function loader({ request }: Route.LoaderArgs) {
  const recPort = new URL(request.url).searchParams.get("rec");
  const res = await fetch(`http://127.0.0.1:${recPort}/rec`);
  const echoed = await res.json();
  return { echoed };
}

export default function FetchOut({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
