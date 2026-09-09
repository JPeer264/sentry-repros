export function loader() {
  throw new Error("Sentry Example Loader Error");
}

export default function LoaderThrows() {
  return <p>never rendered</p>;
}
