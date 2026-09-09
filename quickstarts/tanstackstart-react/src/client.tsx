// manual-setup/index.mdx:131-147 verbatim, plus the repro-only ./qs-hooks import after the instrument import.
// Sentry initialization should be imported first!
import "./instrument.client";
import "./qs-hooks";

import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>
  );
});
