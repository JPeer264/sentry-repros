// docs: platform-includes/getting-started-complete/javascript.remix.mdx:313-320, the `wrapHandleErrorWithSentry`
// form of the snippet (the "Alternative" line 323 lives in app/variants/entry.server.direct.tsx, and the whole
// block pasted as printed in app/variants/entry.server.verbatim.tsx). run.sh copies a variant over this file
// before the build and restores this file afterwards. `handleRequest` is a minimal Remix 2 Node server entry.
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { renderToString } from "react-dom/server";

export const handleError = Sentry.wrapHandleErrorWithSentry(
  (error, { request }) => {
    // Custom handleError implementation
    console.log(`[handleError] ${String(error)} for ${(request as Request).method} ${(request as Request).url}`);
  }
);

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const markup = renderToString(<RemixServer context={remixContext} url={request.url} />);
  responseHeaders.set("Content-Type", "text/html");
  return new Response(`<!DOCTYPE html>${markup}`, { status: responseStatusCode, headers: responseHeaders });
}
