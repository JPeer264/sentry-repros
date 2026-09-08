export async function loader() {
  const res = await fetch(`${process.env.RECORDER_URL}/rec`);
  return { ok: res.status };
}
export default function OutFetch() {
  return <div>outfetch</div>;
}
