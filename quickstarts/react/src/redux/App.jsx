import * as Sentry from "@sentry/react";
import store from "./store";
import { VerifyButtons } from "../shared/VerifyButtons";

window.__store = store;

export default function App() {
  return (
    <div>
      <h1>QS-react redux</h1>
      <VerifyButtons />
      <button
        id="btn-dispatch"
        type="button"
        onClick={() => {
          store.dispatch({ type: "INCREMENT" });
          store.dispatch({ type: "INCREMENT" });
          store.dispatch({ type: "SET_PASSWORD", password: "hunter2" });
          store.dispatch({ type: "GOVERNMENT_SECRETS", secret: "area51" });
        }}
      >
        dispatch
      </button>
      <button
        id="btn-capture-redux"
        type="button"
        onClick={() => Sentry.captureException(new Error("Error with redux state"))}
      >
        capture
      </button>
    </div>
  );
}
