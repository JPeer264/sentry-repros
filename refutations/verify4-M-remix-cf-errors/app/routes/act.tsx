export const action = () => {
  throw new Error('remix-cf action error');
};
export const loader = () => ({ ok: true });
export default function Act() {
  return <h1>act</h1>;
}
