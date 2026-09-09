// Parameterized route. The loader also makes a server-side fetch to the sink's recorder so the run can see
// whether the server SDK attaches `sentry-trace` to outgoing requests.
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`http://localhost:4758/recorder?from=server-loader&id=${params.id}`);
  return json({ id: params.id, recorder: res.status });
}

export default function User() {
  const { id, recorder } = useLoaderData<typeof loader>();
  return (
    <main>
      <h1>
        user <span id="user-id">{id}</span>
      </h1>
      <p>
        recorder status <span id="recorder-status">{recorder}</span>
      </p>
      <Link id="nav-home" to="/">
        home
      </Link>
    </main>
  );
}
