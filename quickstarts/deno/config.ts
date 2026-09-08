// Read with a fallback so the app also boots under `--allow-net` alone (variant a),
// where Deno.env.get throws NotCapable.
function env(name: string, fallback: string): string {
  try {
    return Deno.env.get(name) ?? fallback;
  } catch {
    return fallback;
  }
}

export const SINK = env("SENTRY_TUNNEL", "http://127.0.0.1:44219/");
export const RECORDER = env("RECORDER_URL", "http://127.0.0.1:44219");
export const APP_PORT = Number(env("APP_PORT", "44220"));
