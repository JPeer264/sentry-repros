import http from 'node:http';
const out = [];
http.createServer((req,res)=>{
  if(req.url.startsWith('/__recorder')){res.writeHead(200,{'content-type':'application/json'});res.end('{"recorder":"ok"}');return;}
  if(req.url.startsWith('/__raw')){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(out));return;}
  let b='';req.setEncoding('utf8');req.on('data',c=>b+=c);req.on('end',()=>{out.push(b);res.end('{}');});
}).listen(Number(process.env.PORT),'127.0.0.1',()=>console.log('rawsink',process.env.PORT));
