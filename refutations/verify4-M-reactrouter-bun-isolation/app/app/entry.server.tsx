import type { EntryContext, RouterContextProvider } from "react-router";
import * as Sentry from "@sentry/react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { HandleErrorFunction } from "react-router";

export const streamTimeout = 5_000;

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellError: unknown = undefined;
  const userAgent = request.headers.get("user-agent");
  const waitForAll = (userAgent && isbot(userAgent)) || routerContext.isSpaMode;

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        shellError = error;
        console.error(error);
      },
    },
  );

  if (waitForAll) {
    await stream.allReady;
  }

  void shellError;
  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

export const handleError: HandleErrorFunction = Sentry.createSentryHandleError({
  logErrors: true,
});
