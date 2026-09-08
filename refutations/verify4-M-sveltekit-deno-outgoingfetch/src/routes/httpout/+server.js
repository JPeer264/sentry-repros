import http from 'node:http';
export async function GET() {
  const body = await new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: Number(process.env.REC_PORT), path: '/rec-http', method: 'GET' }, res => {
      let d = ''; res.on('data', c => (d += c)); res.on('end', () => resolve(d));
    });
    req.on('error', reject); req.end();
  });
  return new Response(body);
}
