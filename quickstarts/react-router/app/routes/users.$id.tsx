// Parameterized route for span naming. The loader also makes one server-side fetch to the sink's
// recorder so the sink can record whether the server's outgoing request carried `sentry-trace`.
import type { Route } from "./+types/users.$id";

export async function loader({ params }: Route.LoaderArgs) {
  const sink = process.env.SINK_URL || "http://localhost:4760";
  let recorder = "not reached";
  try {
    const res = await fetch(`${sink}/recorder?from=users-loader-${params.id}`);
    recorder = String(res.status);
  } catch (e) {
    recorder = `failed: ${(e as Error).message}`;
  }
  return { id: params.id, recorder };
}

export default function User({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <h1>
        User <span id="user-id">{loaderData.id}</span>
      </h1>
      <p id="user-recorder">{loaderData.recorder}</p>
    </main>
  );
}
