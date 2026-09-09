// Route components for the router variants, not a docs snippet. Links are built from the first
// path segment so the same components serve /router/* and /router-unwrapped/*.
import { A, useParams } from "@solidjs/router";
import { onMount } from "solid-js";
import { markWired } from "../shared/harness";

const prefix = "/" + window.location.pathname.split("/")[1];

export function Home() {
  onMount(markWired);
  return (
    <div>
      <h1 id="home">QS-solid router home</h1>
      <A id="link-user" href={`${prefix}/users/42`}>user 42</A>
    </div>
  );
}

export function User() {
  const params = useParams();
  onMount(markWired);
  return (
    <div>
      <h1>user <span id="user-id">{params.id}</span></h1>
      <A id="link-home" href={prefix}>home</A>
    </div>
  );
}
