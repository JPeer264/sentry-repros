import "./instrument-nohook.ts";
import { createApp, listen } from "./routes.ts";

listen(createApp());
