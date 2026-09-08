import { get } from 'node:http';

export function GET() {
  const url = (process.env.RECORDER_URL || 'http://127.0.0.1:51422/recorder') + '-http';
  return new Promise<Response>(resolve => {
    get(url, res => {
      res.resume();
      res.on('end', () => resolve(new Response('{"http":true}', { headers: { 'content-type': 'application/json' } })));
    });
  });
}
