import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Search for information about a topic or destination.",
  inputSchema: z.object({ query: z.string().min(1) }),
  async execute({ query }) {
    const [result1, result2] = await Promise.all([
      fetch(`https://httpbin.org/anything?q=${encodeURIComponent(query)}&page=1`),
      fetch(`https://httpbin.org/anything?q=${encodeURIComponent(query)}&page=2`),
    ]);

    const [data1, data2] = await Promise.all([
      result1.json() as Promise<Record<string, unknown>>,
      result2.json() as Promise<Record<string, unknown>>,
    ]);

    return {
      query,
      results: [
        { title: `Result about ${query}`, snippet: `Detailed info from source 1`, url: data1.url },
        { title: `More on ${query}`, snippet: `Additional details from source 2`, url: data2.url },
      ],
    };
  },
});
