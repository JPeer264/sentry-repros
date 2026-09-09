// Repro-only: an action that throws, submitted client-side through <Form>.
import { Form } from "react-router";

export async function action() {
  throw new Error("My first Sentry action error!");
}

export default function ActionError() {
  return (
    <main id="action-page">
      <Form method="post">
        <button id="btn-action" type="submit">
          Submit (action throws)
        </button>
      </Form>
    </main>
  );
}
