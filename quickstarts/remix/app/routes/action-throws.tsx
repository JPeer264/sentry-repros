// Both forms post the two keys named by the docs' `captureActionFormDataKeys: { key_x: true, key_y: true }`
// (getting-started-complete/javascript.remix.mdx:191-194) plus a `password` field and an unlisted field.
// The first form's action returns normally (field `ok`), the second form's action throws.
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  if (form.get("ok")) {
    return json({ ok: true });
  }
  throw new Error("Sentry Example Action Error");
}

export default function ActionThrows() {
  const data = useActionData<typeof action>();
  return (
    <main>
      <h1 id="action-page">action page</h1>
      {data?.ok ? <p id="action-ok">action ok</p> : null}
      <Form method="post">
        <input type="hidden" name="ok" value="1" />
        <input type="hidden" name="key_x" value="x-value" />
        <input type="hidden" name="key_y" value="y-value" />
        <input type="hidden" name="password" value="hunter2" />
        <input type="hidden" name="unlisted" value="unlisted-value" />
        <button id="btn-action-ok" type="submit">
          submit ok action
        </button>
      </Form>
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
