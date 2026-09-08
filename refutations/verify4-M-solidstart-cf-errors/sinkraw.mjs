import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { appendFileSync } from 'node:fs';

const PORT = Number(process.env.PORT || 47313);
const OUT = process.env.OUT || 'raw.jsonl';

function decode(buf, enc) {
  try {
    if (enc === 'gzip') return gunzipSync(buf);
    if (enc === 'deflate') return inflateSync(buf);
    if (enc === 'br') return brotliDecompressSync(buf);
  } catch {}
  return buf;
}

createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = decode(Buffer.concat(chunks), req.headers['content-encoding']).toString('utf8');
    const lines = body.split('\n').filter(Boolean);
    for (let i = 1; i < lines.length; i += 2) {
      let header, payload;
      try { header = JSON.parse(lines[i]); } catch { continue; }
      try { payload = JSON.parse(lines[i + 1]); } catch { payload = lines[i + 1]; }
      appendFileSync(OUT, JSON.stringify({ type: header.type, payload }) + '\n');
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
}).listen(PORT, () => console.log('rawsink listening', PORT));
