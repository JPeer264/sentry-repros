const base = process.env.BASE || 'http://127.0.0.1:41319';
const r = await Promise.all(['a', 'b', 'c'].map(id => fetch(`${base}/iso/${id}`).then(r => r.status)));
console.log('iso statuses', r);
console.log('sentinel', (await fetch(`${base}/sentinel`)).status);
