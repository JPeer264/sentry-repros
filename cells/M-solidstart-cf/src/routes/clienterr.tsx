import { onMount } from 'solid-js';

export default function ClientErr() {
  onMount(() => {
    setTimeout(() => {
      throw new Error('solidstart-cf client boom');
    }, 100);
  });
  return <h1>client error route</h1>;
}
