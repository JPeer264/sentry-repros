import * as Sentry from "@sentry/solidstart";
import { A } from "@solidjs/router";
import { ErrorBoundary, createSignal } from "solid-js";

// getting-started-capture-errors/javascript.solidstart.mdx:2-6 verbatim
// Wrap Solid"s ErrorBoundary to automatically capture exceptions
const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);

// Repro-only server function that throws (`'use server'` RPC, not on the page).
async function serverFunctionThrows() {
  "use server";
  throw new Error("Sentry Test Server Function Error");
}

function Explodes(props: { when: boolean }) {
  if (props.when) throw new Error("Sentry Test Render Error");
  return <div id="boundary-child">Some Component</div>;
}

export default function Home() {
  const [explode, setExplode] = createSignal(false);
  const [serverFnResult, setServerFnResult] = createSignal("");
  const [serverFetchResult, setServerFetchResult] = createSignal("");

  return (
    <main data-wired="1">
      <h1>SolidStart quickstart repro</h1>

      {/* index.mdx:423-431 verbatim */}
      <button
        id="btn-throw"
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>

      {/* index.mdx:467-487 verbatim (the tracing version of the verify button) */}
      <button
        id="btn-span"
        type="button"
        onClick={() => {
          Sentry.startSpan(
            {
              op: "test",
              name: "My First Test Transaction",
            },
            async () => {
              const res = await fetch("/sentry-test");
              if (!res.ok) {
                throw new Error("Sentry Test Error");
              }
            }
          );
        }}
      >
        Break the world
      </button>

      {/* getting-started-capture-errors/javascript.solidstart.mdx:8-14 verbatim, fed by a signal */}
      <button id="btn-boundary" type="button" onClick={() => setExplode(true)}>
        Break the boundary
      </button>
      <SentryErrorBoundary fallback={(err) => <div id="boundary-fallback">Error: {err.message}</div>}>
        <Explodes when={explode()} />
      </SentryErrorBoundary>

      {/* repro-only: server function that throws, server-side fetch to the recorder, navigation */}
      <button
        id="btn-server-fn"
        type="button"
        onClick={async () => {
          try {
            await serverFunctionThrows();
            setServerFnResult("no error");
          } catch (e) {
            setServerFnResult(`caught: ${(e as Error).message}`);
          }
        }}
      >
        Server function throws
      </button>
      <span id="server-fn-result">{serverFnResult()}</span>
      <button
        id="btn-server-fetch"
        type="button"
        onClick={async () => {
          const res = await fetch("/server-fetch");
          setServerFetchResult(JSON.stringify(await res.json()));
        }}
      >
        Server fetch to recorder
      </button>
      <span id="server-fetch-result">{serverFetchResult()}</span>
      <A id="nav-user" href="/users/42">
        User 42
      </A>
    </main>
  );
}
