// index.mdx:191-206 (the tracing version of the verify snippet) plus a harness action.
import Controller from "@ember/controller";
import { action } from "@ember/object";
import * as Sentry from "@sentry/ember";

export default class ApplicationController extends Controller {
  @action
  throwTestError() {
    Sentry.startSpan({ op: "test", name: "Example Span" }, () => {
      setTimeout(() => {
        throw new Error("Sentry Test Error");
      }, 99);
    });
  }

  @action
  async fetchRecorder() {
    await fetch("/recorder?from=relative");
    await fetch(`${window.location.origin}/recorder?from=absolute`);
    document.body.setAttribute("data-fetched", "1");
  }
}
