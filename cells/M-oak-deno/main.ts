import './instrument.ts';
import { buildApp } from './routes.ts';

const PORT = Number(Deno.env.get('APP_PORT'));
const app = buildApp();

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
