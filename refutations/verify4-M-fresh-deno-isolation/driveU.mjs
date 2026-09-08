// node drive.mjs <appPort> <sinkPort> <spec...>
// spec: "c:/a,/b,/c" = concurrent group, "/a" = sequential
const [app, sink, ...specs] = process.argv.slice(2);
const A = `http://127.0.0.1:${app}`;
const S = `http://127.0.0.1:${sink}`;
async function wait(){ for(let i=0;i<80;i++){ try{ const r=await fetch(A+'/api/scopes'); if(r.ok){await r.text(); return true;} }catch{} await new Promise(r=>setTimeout(r,300)); } return false; }
if(!await wait()){ console.log('SERVER NOT READY'); process.exit(1); }
await fetch(S+'/__items',{method:'DELETE'});
for(const s of specs){
  if(s.startsWith('c:')){
    const us=s.slice(2).split(',');
    await Promise.all(us.map(u=>fetch(A+u).then(r=>r.text())));
  } else { await fetch(A+s).then(r=>r.text()); }
}
await new Promise(r=>setTimeout(r,1200));
const items = await (await fetch(S+'/__items')).json();
for(const i of items){
  if(i.type==='transaction') console.log('tx    |',i.name,'| src=',i.source,'| tags=',JSON.stringify(i.tags),'| user=',JSON.stringify(i.user&&i.user.id),'| ctx=',JSON.stringify(i.probeCtx),'| trace=',(i.trace_id||'').slice(0,8));
  else if(i.type==='event') console.log('event |',i.message||i.exception,'| tags=',JSON.stringify(i.tags),'| user=',JSON.stringify(i.user&&i.user.id),'| ctx=',JSON.stringify(i.probeCtx),'| trace=',(i.trace_id||'').slice(0,8));
  else if(i.type==='span') console.log('span  |',JSON.stringify(i.items),'| trace=',(i.trace_id||'').slice(0,8));
  else console.log(i.type);
}
