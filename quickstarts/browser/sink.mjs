import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// Roots the sink serves the page from. The page and the envelope endpoint share an origin, so the
// SDK's `tunnel` target is same-origin and no CORS preflight is involved for the happy path.
const STATIC_ROOTS = [join(HERE, 'public'), join(HERE, 'dist')];
// The CDN bundles built from the same develop commit, served under /vendor/ in place of
// https://browser.sentry-cdn.com/<version>/.
const VENDOR_ROOT = join(HERE, '..', '..', '_toolbox', 'bundles-develop-03aaf424');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const items = [];
const raw = [];
const received = [];

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      synthetic: ex?.mechanism?.synthetic,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      integrations: payload.sdk?.integrations,
      browser: payload.contexts?.browser,
      os: payload.contexts?.os,
      runtime: payload.contexts?.runtime?.name,
      runtime_version: payload.contexts?.runtime?.version,
      hasContextLine: !!ex?.stacktrace?.frames?.some(f => f.context_line),
      topFrame: ex?.stacktrace?.frames?.slice(-1)[0]
        ? {
            function: ex.stacktrace.frames.slice(-1)[0].function,
            filename: ex.stacktrace.frames.slice(-1)[0].filename,
            in_app: ex.stacktrace.frames.slice(-1)[0].in_app,
          }
        : undefined,
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      user: payload.user,
      tags: payload.tags,
      breadcrumbs: (payload.breadcrumbs || []).map(b => `${b.category}: ${b.message ?? b.data?.url ?? ''}`.trim()),
      request: payload.request
        ? { url: payload.request.url, method: payload.request.method, hasData: payload.request.data != null, headers: payload.request.headers }
        : undefined,
      release: payload.release,
      environment: payload.environment,
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      trace_id: payload.contexts?.trace?.trace_id,
      parent_span_id: payload.contexts?.trace?.parent_span_id,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
      measurements: payload.measurements ? Object.keys(payload.measurements) : undefined,
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      sdk: envHeader?.sdk?.name,
      sdk_version: envHeader?.sdk?.version,
      trace_id: envHeader?.trace?.trace_id,
      items: (payload.items || []).map(s => {
        const a = s.attributes || {};
        const op = a['sentry.op']?.value ?? a['sentry.op'];
        return `${op ?? ''} ${s.name ?? ''}`.trim();
      }),
      raw: (payload.items || []).map(s => ({
        name: s.name,
        op: s.attributes?.['sentry.op']?.value,
        status: s.status,
        parent_span_id: s.parent_span_id,
        is_segment: s.is_segment,
        origin: s.attributes?.['sentry.origin']?.value,
        source: s.attributes?.['sentry.source']?.value,
        url: s.attributes?.['url.full']?.value ?? s.attributes?.['http.url']?.value,
        route: s.attributes?.['http.route']?.value,
        method: s.attributes?.['http.request.method']?.value,
        status_code: s.attributes?.['http.response.status_code']?.value,
        segment_name: s.segment_name,
      })),
    };
  }
  if (type === 'log') {
    return { type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  if (type === 'session') {
    return {
      type: 'session',
      status: payload.status,
      errors: payload.errors,
      init: payload.init,
      sid: payload.sid ? `${String(payload.sid).slice(0, 8)}…` : undefined,
      did: payload.did,
      duration: payload.duration != null ? 'set' : undefined,
      attrs: payload.attrs,
    };
  }
  if (type === 'sessions') {
    return { type: 'sessions', aggregates: payload.aggregates, attrs: payload.attrs };
  }
  if (type === 'replay_event') {
    return {
      type: 'replay_event',
      replay_type: payload.replay_type,
      segment_id: payload.segment_id,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      error_ids: (payload.error_ids || []).length,
      trace_ids: (payload.trace_ids || []).length,
      urls: payload.urls,
    };
  }
  if (type === 'replay_recording') {
    return { type: 'replay_recording' };
  }
  if (type === 'client_report') {
    return { type: 'client_report', discarded_events: payload.discarded_events };
  }
  return { type };
}

function parse(body) {
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
      payload = {};
    }
    // Replay recordings are a JSON header followed by a gzipped/plain rrweb blob, keep them opaque.
    raw.push({ envHeader, header, payload: type === 'replay_recording' ? { omitted: true } : payload });
    items.push(compact(type, payload, envHeader));
  }
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', '*');
  res.setHeader('access-control-max-age', '86400');
}

async function serveStatic(pathname, res) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '').replace(/^\/+/, '');
  const roots = pathname.startsWith('/vendor/') ? [VENDOR_ROOT] : STATIC_ROOTS;
  const name = pathname.startsWith('/vendor/') ? rel.replace(/^vendor\//, '') : rel || 'index.html';
  for (const root of roots) {
    try {
      const buf = await readFile(join(root, name));
      res.statusCode = 200;
      res.setHeader('content-type', MIME[extname(name)] ?? 'application/octet-stream');
      res.setHeader('cache-control', 'no-store');
      res.end(buf);
      return true;
    } catch {}
  }
  return false;
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
      origin: req.headers['origin'] ?? null,
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  // late-initialization.mdx:22, "if you are fetching your DSN from an external source".
  if (pathname === '/dsn') {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337');
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
    serveStatic(pathname, res).then(served => {
      if (!served) {
        res.statusCode = 404;
        res.end('not found');
      }
    });
    return;
  }

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
      parse(buf.toString('utf8'));
    } catch (e) {
      console.error('parse error', e);
    }
    res.statusCode = 200;
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 9999), process.env.HOST || 'localhost', function () {
  console.log('sink listening', JSON.stringify(this.address()));
});
