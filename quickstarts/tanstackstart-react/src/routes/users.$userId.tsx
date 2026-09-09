import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  return <p id="user-id">{userId}</p>;
}
