// manual-setup/index.mdx:390-402 verbatim (the "Without --import Flag" variant). run.sh copies it to src/server.ts.
import "../instrument.server.mjs";
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request) {
      return handler.fetch(request);
    },
  })
);
