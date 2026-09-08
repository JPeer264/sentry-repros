import React, { useState } from "react";
import * as Sentry from "@sentry/react";
import { VerifyButtons } from "../shared/VerifyButtons";

function Bomb({ when, message, id }) {
  if (when) {
    throw new Error(message);
  }
  return <span id={id}>ok</span>;
}

// error-boundary.mdx:80-86 (Higher-Order Component)
const Dashboard = ({ explode }) => <Bomb when={explode} message="HOC boundary error" id="dashboard-hoc" />;
const DashboardWithBoundary = Sentry.withErrorBoundary(Dashboard, {
  fallback: <p data-fallback-for="btn-render-error-hoc">Something went wrong</p>,
});

// error-boundary.mdx:181-204 (Custom Error Boundaries)
class CustomErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Captures error with React component stack
    Sentry.captureReactException(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function App() {
  const [basic, setBasic] = useState(false);
  const [fn, setFn] = useState(false);
  const [hoc, setHoc] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [custom, setCustom] = useState(false);
  return (
    <div>
      <h1>QS-react error-boundary</h1>
      <VerifyButtons />
      <button id="btn-render-error" type="button" onClick={() => setBasic(true)}>basic</button>
      <button id="btn-render-error-fn" type="button" onClick={() => setFn(true)}>fallback fn</button>
      <button id="btn-render-error-hoc" type="button" onClick={() => setHoc(true)}>hoc</button>
      <button id="btn-render-error-sidebar" type="button" onClick={() => setSidebar(true)}>sidebar</button>
      <button id="btn-render-error-custom" type="button" onClick={() => setCustom(true)}>custom</button>

      {/* error-boundary.mdx:59-69 (Basic Usage) */}
      <Sentry.ErrorBoundary fallback={<p data-fallback-for="btn-render-error">Something went wrong</p>}>
        <Bomb when={basic} message="Basic boundary error" id="dashboard-basic" />
      </Sentry.ErrorBoundary>

      {/* error-boundary.mdx:92-114 (Fallback UI Options) */}
      <Sentry.ErrorBoundary
        fallback={({ error, componentStack, resetError }) => (
          <div data-fallback-for="btn-render-error-fn">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{error.toString()}</pre>
              <pre>{componentStack}</pre>
            </details>
            <button id="btn-reset" onClick={() => { setFn(false); resetError(); }}>Try again</button>
          </div>
        )}
      >
        <Bomb when={fn} message="Fallback function boundary error" id="dashboard-fn" />
      </Sentry.ErrorBoundary>

      <DashboardWithBoundary explode={hoc} />

      {/* error-boundary.mdx:125-149 (Multiple Boundaries, beforeCapture) */}
      <Sentry.ErrorBoundary
        fallback={<p data-fallback-for="btn-render-error-sidebar">SidebarError</p>}
        beforeCapture={(scope) => scope.setTag("section", "sidebar")}
      >
        <Bomb when={sidebar} message="Sidebar boundary error" id="sidebar" />
      </Sentry.ErrorBoundary>

      <CustomErrorBoundary fallback={<p data-fallback-for="btn-render-error-custom">Custom boundary fallback</p>}>
        <Bomb when={custom} message="Custom boundary error" id="custom" />
      </CustomErrorBoundary>
    </div>
  );
}
