import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];
const RAW_FILE = process.env.RAW;

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    const frames = ex?.stacktrace?.frames ?? [];
    const crumbs = Array.isArray(payload.breadcrumbs) ? payload.breadcrumbs : (payload.breadcrumbs?.values ?? []);
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? ex.value : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      sdk: payload.sdk?.name,
      extra: payload.extra,
      contextsError: payload.contexts?.Error,
      flags: payload.contexts?.flags ?? null,
      crumbs: crumbs.map(b => `${b.type ?? '-'}|${b.category ?? ''}|${b.message ?? ''}|${b.data?.url ?? ''}`),
      frames: frames.map(f => ({
        filename: f.filename,
        pre: Array.isArray(f.pre_context) ? f.pre_context.length : 0,
        post: Array.isArray(f.post_context) ? f.post_context.length : 0,
        ctx: f.context_line,
      })),
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      items: (payload.items || []).map(s => {
        const a = s.attributes || {};
        const op = a['sentry.op']?.value ?? a['sentry.op'];
        return `${op ?? ''} ${s.name ?? ''}`.trim();
      }),
    };
  }
  if (type === 'log') {
    return { type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  return { type };
}

function parse(body) {
  const lines = body.split('\n');
  let envHeader = {};
  try { envHeader = JSON.parse(lines[0] || '{}'); } catch {}
  let i = 1;
  while (i < lines.length) {
    if (!lines[i].trim()) { i++; continue; }
    let header;
    try { header = JSON.parse(lines[i]); } catch { i++; continue; }
    const type = header.type;
    let payloadText = lines[i + 1] ?? '';
    let payload = {};
    if (header.length != null) {
      let acc = payloadText; let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) { acc += '\n' + lines[j]; j++; }
      payloadText = acc; i = j;
    } else {
      i += 2;
    }
    try { payload = JSON.parse(payloadText); } catch { payload = {}; }
    raw.push({ header, payload });
    if (RAW_FILE && type === 'event') {
      try { appendFileSync(RAW_FILE, JSON.stringify(payload) + '\n'); } catch {}
    }
    items.push(compact(type, payload, envHeader));
  }
}

createServer((req, res) => {
  if (req.url?.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; raw.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(req.url.includes('raw') ? raw : items));
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
    try { parse(buf.toString('utf8')); } catch (e) { console.error('parse error', e); }
    res.statusCode = 200;
    res.setHeader('access-control-allow-origin', '*');
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 9999), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 9999));
