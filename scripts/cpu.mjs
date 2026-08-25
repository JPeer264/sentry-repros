// Worker CPU per request for the window recorded by load.sh (Cloudflare GraphQL, workersInvocationsAdaptive).
//
// usage: node scripts/cpu.mjs <run-id> [on|off]
// env:   CLOUDFLARE_ACCOUNT_ID (required)
//        CLOUDFLARE_API_TOKEN  (optional; falls back to the wrangler OAuth token on disk)
//
// The adaptive dataset is sampled, so `requests` can read below 100 for a small window; compare
// cpuMsPerReq, not totals. Analytics lag a few minutes behind the load.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runTarget } from './lib.mjs';

const { worker, window } = runTarget(process.argv.slice(2));
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!account) {
  console.error('set CLOUDFLARE_ACCOUNT_ID');
  process.exit(2);
}
const token = process.env.CLOUDFLARE_API_TOKEN || wranglerOauthToken();
if (!token) {
  console.error('set CLOUDFLARE_API_TOKEN or log in with `wrangler login`');
  process.exit(2);
}

const query = `query($account: String!, $script: String!, $from: Time!, $to: Time!) {
  viewer { accounts(filter: { accountTag: $account }) {
    workersInvocationsAdaptive(limit: 100, filter: { scriptName: $script, datetime_geq: $from, datetime_leq: $to }) {
      sum { requests errors cpuTimeUs }
      quantiles { cpuTimeP50 cpuTimeP99 }
      dimensions { status }
    } } } }`;

const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query, variables: { account, script: worker, from: window.from, to: window.to } }),
});
const json = await res.json();
if (json.errors) {
  throw new Error(`${res.status} ${JSON.stringify(json.errors).slice(0, 500)}`);
}

const rows = json.data.viewer.accounts[0]?.workersInvocationsAdaptive ?? [];
if (!rows.length) {
  console.log(`no data yet for ${worker} in ${window.from}..${window.to} (analytics lag, retry in a minute)`);
}
for (const row of rows) {
  console.log(
    JSON.stringify({
      worker,
      status: row.dimensions.status,
      requests: row.sum.requests,
      errors: row.sum.errors,
      cpuMsPerReq: +(row.sum.cpuTimeUs / row.sum.requests / 1000).toFixed(3),
      p50Us: row.quantiles.cpuTimeP50,
      p99Us: row.quantiles.cpuTimeP99,
    }),
  );
}

function wranglerOauthToken() {
  const candidates = [
    join(homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
    join(homedir(), '.config/.wrangler/config/default.toml'),
    join(homedir(), '.wrangler/config/default.toml'),
  ];
  for (const file of candidates) {
    try {
      const match = /oauth_token\s*=\s*"([^"]+)"/.exec(readFileSync(file, 'utf8'));
      if (match) return match[1];
    } catch {
      // try next location
    }
  }
  return undefined;
}
