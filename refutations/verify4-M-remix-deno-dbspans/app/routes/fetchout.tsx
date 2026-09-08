export async function loader() {
  const res = await fetch(`http://127.0.0.1:${process.env.RECORDER_PORT}/from-remix-loader`);
  return { body: await res.text() };
}
export default function FetchOut() {
  return <div>fetchout</div>;
}
