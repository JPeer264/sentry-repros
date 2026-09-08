import { getActiveSpan, getRootSpan, isObjectLike, debug } from '@sentry/core';
import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';

function getMatchedRoutePath(event) {
  const matchedRoute = event.context.matchedRoute;
  return matchedRoute?.path ?? matchedRoute?.route;
}
function updateRouteBeforeResponse(event) {
  if (!event.context.matchedRoute) {
    return;
  }
  const matchedRoutePath = getMatchedRoutePath(event);
  const requestPath = event.path ?? event._path;
  if (matchedRoutePath && matchedRoutePath !== requestPath) {
    if (matchedRoutePath === "/**") {
      return;
    }
    setHttpServerSpanRouteAttribute(matchedRoutePath);
    const activeSpan = getActiveSpan();
    if (!activeSpan) {
      return;
    }
    const rootSpan = getRootSpan(activeSpan);
    if (!rootSpan) {
      return;
    }
    const params = event.context?.params;
    if (isObjectLike(params)) {
      Object.entries(params).forEach(([key, value]) => {
        rootSpan.setAttributes({
          [`url.path.parameter.${key}`]: String(value),
          [`params.${key}`]: String(value)
        });
      });
    }
    debug.log(`Updated transaction name for parametrized route: ${matchedRoutePath}`);
  }
}

export { updateRouteBeforeResponse };
