export function getServerSideProps() {
  throw new Error("Pages SSR throw");
}

export default function PagesSsrThrow() {
  return <p>never rendered</p>;
}
