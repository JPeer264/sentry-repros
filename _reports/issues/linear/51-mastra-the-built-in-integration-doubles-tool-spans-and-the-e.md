# Mastra: the built-in integration doubles tool spans, and the exporter marks non-streaming calls as streamed

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Low

On the built-in `mastraIntegration` route one tool call produces two `gen_ai.execute_tool` spans, `execute_tool get-weather` under the agent span from Mastra's `client_tool_call` and `execute_tool weatherTool` under the chat span, so tool counts double (DOC-Q68, `results-sdk-only.json`). Mapping `client_tool_call` to `gen_ai.execute_tool` is the cause; the community exporter maps it to `ai.span` and does not double.

On the exporter route the `gen_ai.chat` span carries `gen_ai.request.stream: true` and `gen_ai.response.streaming: true` although both model calls went out with `stream=false` (`results-guide.json`). That half lives in `@mastra/sentry`, so it needs an upstream change or an override on our side.

**Work item.** Map `client_tool_call` to something other than `gen_ai.execute_tool` in `mastraIntegration`, and take the streaming flag from the request in the exporter.

**Evidence.** Getting-started reproduction [`quickstarts/mastra/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/mastra), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
