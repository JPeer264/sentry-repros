import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// The sink serves the page and the wasm files too, so the SDK's `tunnel` target is same-origin
// and the wasm module URL is a plain http://localhost:<port>/<file>.wasm.
const STATIC_ROOTS = [join(HERE, 'public'), join(HERE, 'dist')];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  // instantiateStreaming requires this content type
  '.wasm': 'application/wasm',
};

const items = [];
const raw = [];

function pickFrame(f) {
  return {
    function: f.function,
    filename: f.filename,
    abs_path: f.abs_path,
    lineno: f.lineno,
    colno: f.colno,
    in_app: f.in_app,
    instruction_addr: f.instruction_addr,
    addr_mode: f.addr_mode,
    platform: f.platform,
    module_metadata: f.module_metadata,
  };
}

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    const frames = ex?.stacktrace?.frames || [];
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
      packages: payload.sdk?.packages,
      browser: payload.contexts?.browser,
      frames: frames.map(pickFrame),
      wasmFrames: frames.filter(f => f.instruction_addr || /wasm-function|\.wasm(?:\?|#|$)/.test(String(f.filename))).map(pickFrame),
      debug_meta: payload.debug_meta,
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      user: payload.user,
      breadcrumbs: (payload.breadcrumbs || []).map(b => `${b.category}: ${b.message ?? b.data?.url ?? ''}`.trim()),
      request: payload.request ? { url: payload.request.url, headers: payload.request.headers } : undefined,
      release: payload.release,
      environment: payload.environment,
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      trace_id: payload.contexts?.trace?.trace_id,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
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
        segment_name: s.segment_name,
      })),
    };
  }
  if (type === 'log') {
    return { type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  if (type === 'session') {
    return { type: 'session', status: payload.status, errors: payload.errors, init: payload.init };
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
    raw.push({ envHeader, header, payload });
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
  const name = rel || 'index.html';
  for (const root of STATIC_ROOTS) {
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

  if (pathname === '/__items') {
    if (req.method === 'DELETE') {
      items.length = 0;
      raw.length = 0;
      res.end('[]');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify((req.url || '').includes('raw') ? raw : items));
    return;
  }

  // Chrome probes /favicon.ico on every page load; answer it so the console stays free of 404 noise.
  if (pathname === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
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
}).listen(Number(process.env.PORT || 4734), process.env.HOST || 'localhost', function () {
  console.log('sink listening', JSON.stringify(this.address()));
});
