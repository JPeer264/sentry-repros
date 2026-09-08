import { useState } from "react";
import { VerifyButtons } from "../shared/VerifyButtons";

function Bomb({ when }) {
  if (when) {
    throw new Error("Render error without boundary");
  }
  return <span id="bomb-ok">no bomb</span>;
}

export default function App() {
  const [explode, setExplode] = useState(false);
  return (
    <div>
      <h1>QS-react base</h1>
      <VerifyButtons />
      <button id="btn-render-error" type="button" onClick={() => setExplode(true)}>
        render error
      </button>
      <Bomb when={explode} />
    </div>
  );
}
