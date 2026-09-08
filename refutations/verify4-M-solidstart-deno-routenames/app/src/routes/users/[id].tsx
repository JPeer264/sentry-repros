import { useParams } from '@solidjs/router';

export default function User() {
  const params = useParams();
  return <h1>user {params.id}</h1>;
}
