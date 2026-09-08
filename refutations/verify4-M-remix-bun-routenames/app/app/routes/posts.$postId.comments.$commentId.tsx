import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params }: LoaderFunctionArgs) {
  return { p: params.postId, c: params.commentId };
}

export default function C() {
  return <div>c</div>;
}
