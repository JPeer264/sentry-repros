"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { submitForm } from "./actions";

const SINK_URL = process.env.NEXT_PUBLIC_SINK_URL ?? "http://localhost:4750";

// index.mdx:467-477 calls fetchDataFromAPI without defining it; a same-origin route handler stands in.
async function fetchDataFromAPI() {
  const res = await fetch("/api/hello");
  return res.json();
}

export function VerifyButtons() {
  const [spanResult, setSpanResult] = useState("");
  const [fetchResult, setFetchResult] = useState("");
  const [actionResult, setActionResult] = useState("");

  return (
    <div>
      {/* index.mdx:383-392 verbatim */}
      <button
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Break the world
      </button>

      <button
        id="btn-span"
        type="button"
        onClick={async () => {
          // index.mdx:467-477 verbatim (inside a handler because the snippet uses top-level await)
          const result = await Sentry.startSpan(
            { name: "expensive-operation", op: "function" },
            async () => {
              return await fetchDataFromAPI();
            }
          );
          setSpanResult(JSON.stringify(result));
        }}
      >
        span
      </button>

      <button
        id="btn-log"
        type="button"
        onClick={() => {
          // index.mdx:504-516 verbatim
          Sentry.logger.info("User clicked checkout button");

          Sentry.logger.info("Order completed", {
            orderId: "12345",
            total: 99.99,
          });

          Sentry.logger.warn("Warning message");
          Sentry.logger.error("Error occurred");
        }}
      >
        log
      </button>

      <button
        id="btn-fetch"
        type="button"
        onClick={async () => {
          const viaServer = await fetch("/api/fetch-recorder").then((r) => r.json());
          await fetch(`${SINK_URL}/recorder?from=client-cross-origin`);
          setFetchResult(JSON.stringify(viaServer));
        }}
      >
        fetch
      </button>

      <form
        action={async (formData) => {
          const r = await submitForm(formData);
          setActionResult(JSON.stringify(r));
        }}
      >
        <input name="name" defaultValue="jane" />
        <button id="btn-action" type="submit">
          action
        </button>
      </form>

      <pre id="span-result">{spanResult}</pre>
      <pre id="fetch-result">{fetchResult}</pre>
      <pre id="action-result">{actionResult}</pre>
    </div>
  );
}
