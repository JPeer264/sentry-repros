const P = process.env.PORT;
const [a,b,c] = await Promise.all(['alpha','beta','gamma'].map(t => fetch(`http://127.0.0.1:${P}/tag?tag=${t}`).then(r=>r.text())));
console.log(a); console.log(b); console.log(c);
await new Promise(r=>setTimeout(r,300));
await fetch(`http://127.0.0.1:${P}/sentinel`).then(r=>r.text());
