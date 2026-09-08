import type { APIEvent } from '@solidjs/start/server';
import { getActiveSpan, getRootSpan, spanToJSON } from '@sentry/cloudflare';

export function GET(event: APIEvent) {
  const native: any = (event as any).nativeEvent;
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : undefined;
  const body = {
    params: event.params,
    eventKeys: Object.keys(event as any),
    nativeContextKeys: native?.context ? Object.keys(native.context) : null,
    matchedRoute: native?.context?.matchedRoute ?? null,
    nativeParams: native?.context?.params ?? null,
    nativePath: native?.path ?? native?._path ?? null,
    hasActiveSpan: !!active,
    rootSpanName: root ? spanToJSON(root).description : null,
    rootSpanAttrs: root ? spanToJSON(root).attributes : null,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json' } });
}
