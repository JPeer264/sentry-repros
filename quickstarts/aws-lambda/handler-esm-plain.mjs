// The CommonJS verify snippet (index.mdx:42-46) as an ES module, no wrapHandler; same shape as the package README "Verify" block.
export const handler = async (event, context) => {
  throw new Error("This is a test error");
};
