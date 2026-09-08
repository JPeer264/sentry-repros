import { fetch as undiciFetch } from 'undici';

export async function loader() {
  const rec = process.env.REC_URL as string;
  const res = await undiciFetch(`${rec}/rec-undici`);
  const text = await res.text();
  return { text };
}
export default function UndiciFetch() {
  return <div>undicifetch</div>;
}
