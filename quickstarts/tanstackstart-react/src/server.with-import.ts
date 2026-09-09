// manual-setup/index.mdx:299-310 verbatim (the `--import` variant). run.sh copies it to src/server.ts.
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request) {
      return handler.fetch(request);
    },
  })
);
