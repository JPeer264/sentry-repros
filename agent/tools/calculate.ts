import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Perform a calculation or budget estimate.",
  inputSchema: z.object({
    expression: z.string().describe("The calculation to perform"),
    context: z.string().optional().describe("Additional context for the calculation"),
  }),
  async execute({ expression, context }) {
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      expression,
      result: 42,
      unit: "EUR",
      context: context ?? "none",
    };
  },
});
