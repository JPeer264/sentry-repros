import { createServer } from 'node:http'
import { gunzipSync, inflateSync } from 'node:zlib'

const items = []

function decode(buf, enc) {
  try {
    if (enc === 'gzip') return gunzipSync(buf)
    if (enc === 'deflate') return inflateSync(buf)
  } catch {}
  return buf
}

function parseEnvelope(text) {
  const lines = text.split('\n').filter(Boolean)
  const header = JSON.parse(lines[0])
  const out = []
  for (let i = 1; i < lines.length; i += 2) {
    let ih
    try { ih = JSON.parse(lines[i]) } catch { break }
    let body
    try { body = JSON.parse(lines[i + 1]) } catch { body = null }
    out.push({ envHeader: header, itemHeader: ih, body })
  }
  return out
}

const server = createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(items, null, 2))
    return
  }
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const raw = decode(Buffer.concat(chunks), req.headers['content-encoding'])
    try {
      for (const { envHeader, itemHeader, body } of parseEnvelope(raw.toString('utf8'))) {
        const t = itemHeader.type
        if (t === 'event') {
          items.push({
            type: 'event',
            message: body.message,
            exception: body.exception?.values?.[0]?.value,
            transaction: body.transaction,
            trace_id: body.contexts?.trace?.trace_id,
            span_id: body.contexts?.trace?.span_id,
            tags: body.tags,
            sdk: body.sdk?.name,
          })
        } else if (t === 'transaction') {
          items.push({
            type: 'transaction',
            name: body.transaction,
            op: body.contexts?.trace?.op,
            source: body.transaction_info?.source,
            trace_id: body.contexts?.trace?.trace_id,
            tags: body.tags,
            spans: (body.spans || []).map(s => `${s.op} ${s.description}`),
          })
        } else if (t === 'span') {
          const arr = Array.isArray(body?.items) ? body.items : [body]
          for (const s of arr) {
            items.push({
              type: 'span',
              name: s.name,
              op: s.attributes?.['sentry.op']?.value ?? s.attributes?.['sentry.op'],
              trace_id: s.trace_id,
              span_id: s.span_id,
              parent: s.parent_span_id,
            })
          }
        } else if (t === 'log') {
          for (const l of body.items || []) items.push({ type: 'log', body: l.body, trace_id: l.trace_id })
        } else {
          items.push({ type: t, trace_id: envHeader.trace?.trace_id })
        }
      }
    } catch (e) {
      items.push({ type: 'parse-error', error: String(e) })
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end('{}')
  })
})
server.listen(process.env.PORT || 47312, () => console.log('sink listening', process.env.PORT || 47312))
