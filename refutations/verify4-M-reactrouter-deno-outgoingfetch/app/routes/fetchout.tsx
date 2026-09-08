export async function loader() {
  const rec = process.env.REC_URL as string;
  const res = await fetch(`${rec}/rec-fetch`);
  const text = await res.text();
  return { text };
}
export default function FetchOut() {
  return <div>fetchout</div>;
}
