/**
 * Custom dev server that wraps Parcel and adds Permissions-Policy header.
 * This simulates environments like Shopify where display-capture is restricted.
 */

import { createServer } from 'http';
import httpProxy from 'http-proxy';
import { spawn } from 'child_process';

const { createProxyServer } = httpProxy;

const PORT = 8766;
const PARCEL_PORT = 8767;

// Start Parcel in the background
const parcel = spawn('npx', ['parcel', 'serve', 'src/host.html', '--port', PARCEL_PORT.toString()], {
  stdio: 'inherit',
  shell: true,
});

// Wait for Parcel to start
await new Promise(resolve => setTimeout(resolve, 3000));

// Create proxy to Parcel
const proxy = createProxyServer({ target: `http://localhost:${PARCEL_PORT}` });

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(502);
  res.end('Proxy error - is Parcel running?');
});

// Create server that adds Permissions-Policy header
const server = createServer((req, res) => {
  // Add Permissions-Policy header to restrict display-capture
  res.setHeader('Permissions-Policy', 'display-capture=()');

  proxy.web(req, res);
});

// Handle WebSocket for HMR
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Proxying to Parcel at http://localhost:${PARCEL_PORT}`);
  console.log(`   Permissions-Policy: display-capture=() is active\n`);
  console.log(`Open http://localhost:${PORT}/src/host.html to test\n`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  parcel.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  parcel.kill();
  process.exit();
});
