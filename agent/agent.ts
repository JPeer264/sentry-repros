import { openrouter } from "@openrouter/ai-sdk-provider";
import { defineAgent } from "eve";

export default defineAgent({
  model: openrouter("openai/gpt-4.1-nano"),
  // OpenRouter models are not in the AI Gateway catalog, so eve cannot look up
  // the context window and compaction fails to compile without this value.
  modelContextWindowTokens: 1_047_576,
});
