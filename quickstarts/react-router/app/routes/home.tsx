// Verify page. The guide's verify step is a loader that throws (routes/error.tsx), it has no button;
// these buttons are the browser-side probes shared with the other quickstart runs.
import { useState } from "react";
import * as Sentry from "@sentry/react-router";

export default function Home() {
  const [boom, setBoom] = useState(false);
  const [fetched, setFetched] = useState<string>("");
  if (boom) {
    throw new Error("Render error from the home route");
  }
  return (
    <main id="home">
      <h1>QS-react-router</h1>
      <button
        id="btn-throw"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Throw error
      </button>
      <button
        id="btn-span"
        onClick={() => {
          Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, () => {
            setTimeout(() => {
              throw new Error("Sentry Test Error (span)");
            }, 99);
          });
        }}
      >
        Start span
      </button>
      <button
        id="btn-fetch"
        onClick={async () => {
          const res = await fetch("/api/recorder?from=client-button");
          const seen = await res.json();
          setFetched(JSON.stringify(seen));
        }}
      >
        Fetch recorder
      </button>
      <button id="btn-render-error" onClick={() => setBoom(true)}>
        Render error
      </button>
      <pre id="fetched">{fetched}</pre>
    </main>
  );
}
