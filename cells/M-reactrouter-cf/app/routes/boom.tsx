export function loader() {
  throw new Error('rr-deno loader boom');
}

export default function Boom() {
  return <pre>never</pre>;
}
