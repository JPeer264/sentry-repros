import "../shared/instrument";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import ProfiledApp from "./App";
import { VerifyButtons } from "../shared/VerifyButtons";
import { installHarness } from "../shared/harness";
import { version } from "react";

installHarness();
window.__reactVersion = version;

function Root() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(true);
  return (
    <div>
      <h1>QS-react profiler</h1>
      <VerifyButtons />
      <button id="btn-update" type="button" onClick={() => setTick(t => t + 1)}>update</button>
      <button id="btn-unmount" type="button" onClick={() => setMounted(false)}>unmount</button>
      <span id="tick">{tick}</span>
      {mounted ? <ProfiledApp tick={tick} /> : null}
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Root />);
