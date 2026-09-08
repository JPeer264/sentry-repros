import http from 'node:http';

export async function loader() {
  const rec = process.env.REC_URL as string;
  const text: string = await new Promise((resolve, reject) => {
    const req = http.get(`${rec}/rec-http`, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
  return { text };
}
export default function HttpOut() {
  return <div>httpout</div>;
}
