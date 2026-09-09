// docs/platforms/javascript/guides/aws-lambda/index.mdx:42-46 (CommonJS verify tab), verbatim. Docs name the file index.js.
exports.handler = async (event, context) => {
  throw new Error("This is a test error");
};
