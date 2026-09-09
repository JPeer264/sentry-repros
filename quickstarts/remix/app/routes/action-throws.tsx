// The form posts the two keys named by the docs' `captureActionFormDataKeys: { key_x: true, key_y: true }`
// (getting-started-complete/javascript.remix.mdx:191-194) plus a `password` field and an unlisted field.
import { Form } from "@remix-run/react";

export async function action() {
  throw new Error("Sentry Example Action Error");
}

export default function ActionThrows() {
  return (
    <main>
      <h1 id="action-page">action page</h1>
      <Form method="post">
        <input type="hidden" name="key_x" value="x-value" />
        <input type="hidden" name="key_y" value="y-value" />
        <input type="hidden" name="password" value="hunter2" />
        <input type="hidden" name="unlisted" value="unlisted-value" />
        <button id="btn-action" type="submit">
          submit action
        </button>
      </Form>
    </main>
  );
}
