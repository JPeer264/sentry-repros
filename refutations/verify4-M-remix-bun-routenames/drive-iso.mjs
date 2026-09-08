const base = process.env.APP_URL;
const res = await Promise.all(['a', 'b', 'c'].map(id => fetch(`${base}/iso/${id}`, { headers: { accept: 'text/html' } }).then(r => r.status)));
console.log('iso', res);
await fetch(`${base}/sentinel`, { headers: { accept: 'text/html' } });
