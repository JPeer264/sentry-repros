import { request } from 'node:http';

export default defineEventHandler(async () => {
  const body: string = await new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port: Number(process.env.REC_PORT || '34012'), path: '/rec-nodehttp', method: 'GET' },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve(d));
      },
    );
    req.on('error', reject);
    req.end();
  });
  return { ok: true, body };
});
