import http from 'node:http';
const items = [];
http.createServer((req, res) => {
  if (req.method === 'DELETE') { items.length = 0; res.writeHead(200).end('ok'); return; }
  if (req.url.startsWith('/__items')) {
    res.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify(items, null, 2)); return;
  }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const lines = body.split('\n').filter(Boolean);
    let hdr = {};
    try { hdr = JSON.parse(lines[0]); } catch {}
    const envSdk = hdr.sdk ? `${hdr.sdk.name}@${hdr.sdk.version}` : '(none)';
    for (let i = 1; i < lines.length; i += 2) {
      let ih = {}, pl = {};
      try { ih = JSON.parse(lines[i]); } catch {}
      try { pl = JSON.parse(lines[i+1]); } catch {}
      const t = ih.type || '?';
      let payloadSdk = pl.sdk ? `${pl.sdk.name}@${pl.sdk.version}` : '(none)';
      let pkgs = pl.sdk && pl.sdk.packages ? pl.sdk.packages.map(p => p.name).join(',') : '';
      let desc = '';
      if (t === 'event') desc = pl.message || (pl.exception?.values?.[0]?.value ?? '');
      if (t === 'transaction') desc = `${pl.transaction} (${pl.contexts?.trace?.op})`;
      if (t === 'span') { desc = (pl.items||[]).map(s => `${s.attributes?.['sentry.op']||'?'} ${s.name}`).join(' | ');
        payloadSdk = (pl.items||[]).map(s => s.attributes?.['sentry.sdk.name']).filter(Boolean).join(',') || payloadSdk; }
      items.push({ type: t, envelopeSdk: envSdk, payloadSdk, pkgs, desc });
    }
    res.writeHead(200).end('ok');
  });
}).listen(process.env.PORT, () => console.log('sink on', process.env.PORT));
