// Local stand-in for the OpenAI API on 127.0.0.1:4740. Speaks /v1/chat/completions and /v1/responses,
// streaming and non-streaming. First call of a run answers with a get-weather tool call, a call that
// already carries a tool result answers with text. Nothing leaves the machine.
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 4740);
let n = 0;
const usage = { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 };
const sse = (res, obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

function chat(req, body, res) {
  const stream = !!body.stream;
  const hasToolResult = (body.messages || []).some((m) => m.role === 'tool');
  const id = `chatcmpl-mock-${n}`;
  const base = { id, object: stream ? 'chat.completion.chunk' : 'chat.completion', created: Math.floor(Date.now() / 1000), model: 'gpt-4o-mini-2024-07-18' };
  const toolCall = { id: `call_${n}`, type: 'function', function: { name: 'get-weather', arguments: '{"location":"Berlin"}' } };
  const text = `It is 21 degrees and sunny in Berlin (mock ${n}).`;
  if (!stream) {
    const message = hasToolResult ? { role: 'assistant', content: text, refusal: null } : { role: 'assistant', content: null, tool_calls: [toolCall], refusal: null };
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ...base, choices: [{ index: 0, message, logprobs: null, finish_reason: hasToolResult ? 'stop' : 'tool_calls' }], usage }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  sse(res, { ...base, choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }] });
  if (hasToolResult) {
    sse(res, { ...base, choices: [{ index: 0, delta: { content: text }, finish_reason: null }] });
    sse(res, { ...base, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] });
  } else {
    sse(res, { ...base, choices: [{ index: 0, delta: { tool_calls: [{ index: 0, ...toolCall }] }, finish_reason: null }] });
    sse(res, { ...base, choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] });
  }
  sse(res, { ...base, choices: [], usage });
  res.write('data: [DONE]\n\n');
  res.end();
}

function responses(req, body, res) {
  const stream = !!body.stream;
  const input = Array.isArray(body.input) ? body.input : [];
  const hasToolResult = input.some((i) => i && i.type === 'function_call_output');
  const id = `resp_mock_${n}`;
  const text = `It is 21 degrees and sunny in Berlin (mock ${n}).`;
  const fnItem = { type: 'function_call', id: `fc_${n}`, call_id: `call_${n}`, name: 'get-weather', arguments: '{"location":"Berlin"}', status: 'completed' };
  const msgItem = { type: 'message', id: `msg_${n}`, role: 'assistant', status: 'completed', content: [{ type: 'output_text', text, annotations: [] }] };
  const item = hasToolResult ? msgItem : fnItem;
  const rUsage = { input_tokens: 12, output_tokens: 7, total_tokens: 19, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } };
  const response = (status, extra) => ({ id, object: 'response', created_at: Math.floor(Date.now() / 1000), status, model: 'gpt-4o-mini-2024-07-18', output: status === 'completed' ? [item] : [], usage: status === 'completed' ? rUsage : null, ...extra });
  if (!stream) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response('completed')));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  let seq = 0;
  const ev = (type, data) => sse(res, { type, sequence_number: seq++, ...data });
  ev('response.created', { response: response('in_progress') });
  ev('response.in_progress', { response: response('in_progress') });
  if (hasToolResult) {
    ev('response.output_item.added', { output_index: 0, item: { ...msgItem, status: 'in_progress', content: [] } });
    ev('response.content_part.added', { item_id: msgItem.id, output_index: 0, content_index: 0, part: { type: 'output_text', text: '', annotations: [] } });
    ev('response.output_text.delta', { item_id: msgItem.id, output_index: 0, content_index: 0, delta: text });
    ev('response.output_text.done', { item_id: msgItem.id, output_index: 0, content_index: 0, text });
    ev('response.content_part.done', { item_id: msgItem.id, output_index: 0, content_index: 0, part: { type: 'output_text', text, annotations: [] } });
    ev('response.output_item.done', { output_index: 0, item: msgItem });
  } else {
    ev('response.output_item.added', { output_index: 0, item: { ...fnItem, arguments: '', status: 'in_progress' } });
    ev('response.function_call_arguments.delta', { item_id: fnItem.id, output_index: 0, delta: fnItem.arguments });
    ev('response.function_call_arguments.done', { item_id: fnItem.id, output_index: 0, arguments: fnItem.arguments });
    ev('response.output_item.done', { output_index: 0, item: fnItem });
  }
  ev('response.completed', { response: response('completed') });
  res.end();
}

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let parsed = {};
    try { parsed = JSON.parse(body || '{}'); } catch {}
    n += 1;
    const toolResult = (parsed.messages || []).some((m) => m.role === 'tool') || (Array.isArray(parsed.input) && parsed.input.some((i) => i && i.type === 'function_call_output'));
    console.log(`mock ${req.method} ${req.url} stream=${!!parsed.stream} model=${parsed.model} tools=${(parsed.tools || []).length} toolResultInInput=${toolResult} auth=${req.headers.authorization}`);
    if (req.method === 'POST' && req.url.replace(/\?.*$/, '') === '/v1/chat/completions') return chat(req, parsed, res);
    if (req.method === 'POST' && req.url.replace(/\?.*$/, '') === '/v1/responses') return responses(req, parsed, res);
    console.log(`mock ${req.method} ${req.url} (unhandled) body=${body.slice(0, 300)}`);
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{"error":{"message":"not found"}}');
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock openai on http://127.0.0.1:${PORT}`));
