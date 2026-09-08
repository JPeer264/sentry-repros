import { json } from '@sveltejs/kit';
import dc from 'node:diagnostics_channel';

export function GET() {
	return json({
		undiciRequestCreate: dc.channel('undici:request:create').hasSubscribers,
		mysql2Query: dc.tracingChannel('mysql2:query').start.hasSubscribers,
		httpClientRequestCreated: dc.channel('http.client.request.created').hasSubscribers
	});
}
