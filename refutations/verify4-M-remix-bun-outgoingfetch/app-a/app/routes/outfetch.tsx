export async function loader() {
  const res = await fetch(`${process.env.RECORDER_URL}/rec`);
  const text = await res.text();
  return { ok: text };
}

export default function OutFetch() {
  return <div>outfetch</div>;
}
