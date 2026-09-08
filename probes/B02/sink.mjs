import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];
const RAW_FILE = process.env.RAW;

// Contexts the SDK always attaches; kept out of `contexts` so user-set ones stand out.
const DEFAULT_CONTEXTS = new Set(['trace', 'runtime', 'app', 'os', 'device', 'culture', 'cloud_resource']);

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    const frames = ex?.stacktrace?.frames ?? [];
    const contexts = {};
    for (const [k, v] of Object.entries(payload.contexts ?? {})) {
      if (!DEFAULT_CONTEXTS.has(k)) contexts[k] = v;
    }
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? ex.value : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      synthetic: ex?.mechanism?.synthetic,
      sdk: payload.sdk?.name,
      sdkVersion: payload.sdk?.version,
      runtime: payload.contexts?.runtime,
      os: payload.contexts?.os,
      server_name: payload.server_name,
      user: payload.user,
      tags: payload.tags,
      contexts,
      contextKeys: Object.keys(payload.contexts ?? {}),
      extra: payload.extra,
      breadcrumbs: (Array.isArray(payload.breadcrumbs) ? payload.breadcrumbs : (payload.breadcrumbs?.values ?? [])).map(b => ({
        category: b.category,
        message: b.message,
        level: b.level,
        data: b.data,
      })),
      frames: frames.map(f => ({
        filename: f.filename,
        in_app: f.in_app,
        function: f.function,
        lineno: f.lineno,
        colno: f.colno,
        context_line: f.context_line,
        hasPre: Array.isArray(f.pre_context) && f.pre_context.length > 0,
        hasPost: Array.isArray(f.post_context) && f.post_context.length > 0,
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
      trace_id: envHeader?.trace?.trace_id,
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
    raw.push({ envHeader, header, payload });
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
    const text = buf.toString('utf8');
    if (RAW_FILE) { try { appendFileSync(RAW_FILE, text + '\n=====\n'); } catch {} }
    try { parse(text); } catch (e) { console.error('parse error', e); }
    res.statusCode = 200;
    res.setHeader('access-control-allow-origin', '*');
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 9999), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 9999));
