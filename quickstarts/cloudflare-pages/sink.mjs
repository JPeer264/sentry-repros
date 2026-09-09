// Envelope sink: same shape as ../cloudflare/sink.mjs, the recorder lives in recorder.mjs.
import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { handleRecorder, resetRecorder } from './recorder.mjs';

const items = [];
const raw = [];

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      integrations: payload.sdk?.integrations,
      runtime: payload.contexts?.runtime?.name,
      runtime_version: payload.contexts?.runtime?.version,
      hasContextLine: !!ex?.stacktrace?.frames?.some(f => f.context_line),
      appFrames: (ex?.stacktrace?.frames || []).filter(f => f.in_app).map(f => ({ filename: f.filename, function: f.function })),
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      user: payload.user,
      tags: payload.tags,
      request: payload.request ? { url: payload.request.url, method: payload.request.method, hasData: payload.request.data != null, headers: payload.request.headers } : undefined,
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
      sdk: payload.sdk?.name,
      sdk_version: payload.sdk?.version,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
    };
  }
  if (type === 'span') {
    const attr = (s, k) => s.attributes?.[k]?.value ?? s.attributes?.[k];
    return {
      type: 'span',
      sdk: envHeader?.sdk?.name,
      sdk_version: envHeader?.sdk?.version,
      trace_id: envHeader?.trace?.trace_id,
      items: (payload.items || []).map(s => `${attr(s, 'sentry.op') ?? ''} ${s.name ?? ''}`.trim()),
      raw: (payload.items || []).map(s => ({
        name: s.name, op: attr(s, 'sentry.op'), status: s.status, is_segment: s.is_segment,
        parent_span_id: s.parent_span_id, origin: attr(s, 'sentry.origin'),
        segment_name_source: attr(s, 'sentry.segment.name.source'), source: attr(s, 'sentry.source'),
        url_path: attr(s, 'url.path'), url_full: attr(s, 'url.full'), route: attr(s, 'http.route'),
        method: attr(s, 'http.request.method'), status_code: attr(s, 'http.response.status_code'),
      })),
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
  if (handleRecorder(req, res)) return;
  if (req.url?.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; raw.length = 0; resetRecorder(); res.end('[]'); return; }
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
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 4747), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 4747));
