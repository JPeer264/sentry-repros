import { useParams } from '@solidjs/router';

export default function Thing() {
  const params = useParams();
  return <main>thing {params.slug}</main>;
}
