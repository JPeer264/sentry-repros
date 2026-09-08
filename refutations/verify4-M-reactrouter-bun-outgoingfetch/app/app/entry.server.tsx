import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
import type { HandleErrorFunction } from "react-router";
import { renderToReadableStream } from "react-dom/server";
import { isbot } from "isbot";
import * as Sentry from "@sentry/react-router";

export const streamTimeout = 5_000;

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders });
  }

  let didError = false;
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        didError = true;
        console.error(error);
      },
    },
  );

  const userAgent = request.headers.get("user-agent");
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await stream.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    headers: responseHeaders,
    status: didError ? 500 : responseStatusCode,
  });
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

export const handleError: HandleErrorFunction = Sentry.createSentryHandleError({ logErrors: true });
