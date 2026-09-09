// Repro-only: the guide has no agent snippet ("A Mastra application using @mastra/core" is a prerequisite).
// One agent with one tool; the model is an OpenAI-compatible mock on 127.0.0.1:4740 via Mastra's
// { id, url, apiKey } model config, so no real LLM call is made.
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get the current weather for a location',
  inputSchema: z.object({ location: z.string() }),
  outputSchema: z.object({ temperature: z.number(), conditions: z.string() }),
  execute: async (args) => {
    const input = args && typeof args === 'object' && 'context' in args && args.context ? args.context : args;
    if (process.env.TOOL_FAIL) throw new Error(`weather service down for ${input?.location}`);
    return { temperature: 21, conditions: 'sunny' };
  },
});

export const weatherAgent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: 'You are a weather assistant. Always call the get-weather tool before answering.',
  model: { id: 'openai/gpt-4o-mini', url: process.env.OPENAI_BASE_URL || 'http://127.0.0.1:4740/v1', apiKey: 'mock-key' },
  tools: { weatherTool },
});
