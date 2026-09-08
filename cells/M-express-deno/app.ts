import "./instrument.ts";
import { createApp, listen } from "./routes.ts";

listen(createApp());
