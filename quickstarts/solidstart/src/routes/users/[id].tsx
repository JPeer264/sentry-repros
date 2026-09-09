// Repro-only parameterized route (the page has none): shows the param and loads data
// through a server function so the navigation carries a server call.
import { A, createAsync, useParams } from "@solidjs/router";

async function getUser(id: string) {
  "use server";
  return { id, name: `user-${id}` };
}

export default function User() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return (
    <main data-wired="1">
      <h1>
        User <span id="user-id">{params.id}</span>
      </h1>
      <p id="user-name">{user()?.name}</p>
      <A id="nav-home" href="/">
        Home
      </A>
    </main>
  );
}
