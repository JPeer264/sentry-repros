// Envelope sink for the TanStack Start reproduction, copied from ../react/sink.mjs with the static server
// removed (the Nitro server on 4763 serves the app). Every POST is parsed as an envelope; the request path
// tells the side apart: the browser tunnels to /tunnel, the Node SDK posts to /api/1/envelope/. The
// /recorder route records `sentry-trace` and `baggage` of whatever fetches it.
import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];
const received = [];

function flattenAttributes(attributes) {
  const out = {};
  for (const [k, v] of Object.entries(attributes || {})) {
    out[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
  }
  return out;
}

function compact(type, payload, envHeader, header, side) {
  if (type === 'event') {
    const values = payload.exception?.values || [];
    const ex = values[0];
    const top = ex?.stacktrace?.frames?.slice(-1)[0];
    return {
      type: 'event',
      side,
      level: payload.level,
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      exceptions: values.map(v => ({ type: v.type, value: v.value, mechanism: v.mechanism?.type, handled: v.mechanism?.handled, frames: v.stacktrace?.frames?.length })),
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      integrations: payload.sdk?.integrations,
      contexts: Object.keys(payload.contexts || {}),
      topFrame: top ? { function: top.function, filename: top.filename, in_app: top.in_app } : undefined,
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      tags: payload.tags,
      breadcrumbs: (payload.breadcrumbs || []).map(b => `${b.category}: ${b.message ?? b.data?.url ?? ''}`.trim()),
      request: payload.request ? { url: payload.request.url, method: payload.request.method, headers: payload.request.headers } : undefined,
      release: payload.release,
      environment: payload.environment,
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      side,
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      trace_id: payload.contexts?.trace?.trace_id,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      side,
      sdk: envHeader?.sdk?.name,
      sdk_version: envHeader?.sdk?.version,
      trace_id: envHeader?.trace?.trace_id,
      items: (payload.items || []).map(s => {
        const a = flattenAttributes(s.attributes);
        return `${a['sentry.op'] ?? ''} ${s.name ?? ''}`.trim();
      }),
      raw: (payload.items || []).map(s => {
        const a = flattenAttributes(s.attributes);
        return {
          name: s.name,
          op: a['sentry.op'],
          status: s.status,
          trace_id: s.trace_id,
          span_id: s.span_id,
          parent_span_id: s.parent_span_id,
          is_segment: s.is_segment,
          segment_name: s.segment_name,
          origin: a['sentry.origin'],
          source: a['sentry.source'] ?? a['sentry.segment.name.source'],
          url: a['url.full'] ?? a['http.url'],
          url_path: a['url.path'],
          route: a['http.route'],
          method: a['http.request.method'],
          status_code: a['http.response.status_code'],
          duration_ms: s.start_timestamp != null && s.end_timestamp != null ? Math.round((s.end_timestamp - s.start_timestamp) * 1000) : undefined,
          attributes: a,
        };
      }),
    };
  }
  if (type === 'log') {
    return { type: 'log', side, items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  if (type === 'session') {
    return { type: 'session', side, status: payload.status, errors: payload.errors, init: payload.init, attrs: payload.attrs };
  }
  if (type === 'replay_event') {
    return { type: 'replay_event', side, replay_type: payload.replay_type, segment_id: payload.segment_id, error_ids: (payload.error_ids || []).length, trace_ids: (payload.trace_ids || []).length, urls: payload.urls };
  }
  if (type === 'replay_recording') return { type: 'replay_recording', side };
  if (type === 'client_report') return { type: 'client_report', side, discarded_events: payload.discarded_events };
  if (type === 'feedback') return { type: 'feedback', side, message: payload.contexts?.feedback?.message };
  return { type, side };
}

function parse(body, side) {
  const lines = body.split('\n');
  let envHeader = {};
  try {
    envHeader = JSON.parse(lines[0] || '{}');
  } catch {}
  let i = 1;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }
    let header;
    try {
      header = JSON.parse(lines[i]);
    } catch {
      i++;
      continue;
    }
    const type = header.type;
    let payloadText = lines[i + 1] ?? '';
    let payload = {};
    if (header.length != null) {
      let acc = payloadText;
      let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) {
        acc += '\n' + lines[j];
        j++;
      }
      payloadText = acc;
      i = j;
    } else {
      i += 2;
    }
    try {
      payload = JSON.parse(payloadText);
    } catch {
      payload = { text: payloadText.slice(0, 200) };
    }
    raw.push({ side, envHeader, header, payload: type === 'replay_recording' ? { omitted: true } : payload });
    items.push(compact(type, payload, envHeader, header, side));
  }
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', '*');
  res.setHeader('access-control-max-age', '86400');
}

createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  const pathname = (req.url || '/').split('?')[0];

  if (pathname === '/recorder') {
    received.push({
      url: req.url,
      'sentry-trace': req.headers['sentry-trace'] ?? null,
      baggage: req.headers['baggage'] ?? null,
      traceparent: req.headers['traceparent'] ?? null,
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (pathname === '/__headers') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(received));
    return;
  }
  if (pathname === '/__items') {
    if (req.method === 'DELETE') {
      items.length = 0;
      raw.length = 0;
      received.length = 0;
      res.end('[]');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify((req.url || '').includes('raw') ? raw : items));
    return;
  }
  if (req.method === 'GET') {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const side = pathname === '/tunnel' ? 'client' : 'server';
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let buf = Buffer.concat(chunks);
    const enc = req.headers['content-encoding'];
    try {
      if (enc === 'gzip') buf = gunzipSync(buf);
      else if (enc === 'deflate') buf = inflateSync(buf);
      else if (enc === 'br') buf = brotliDecompressSync(buf);
    } catch {}
    try {
      parse(buf.toString('utf8'), side);
    } catch (e) {
      console.error('parse error', e);
    }
    res.statusCode = 200;
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 4762), process.env.HOST || 'localhost', function () {
  console.log('sink listening', JSON.stringify(this.address()));
});
