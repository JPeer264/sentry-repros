// manual-setup/index.mdx:609-630 verbatim.
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/sentry-example")({
  server: {
    handlers: {
      GET: () => {
        throw new Error("Sentry Example Route Error");
        return new Response(
          JSON.stringify({ message: "Testing Sentry Error..." }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      },
    },
  },
});
