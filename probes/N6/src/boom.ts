// padding so contextLines has 3 pre_context lines for the throw site
// (the record's boom.ts frame shows pre=3)

export function boom(): never {
  // three lines of padding so contextLines has pre_context to pick up
  const e = new Error("nested boom") as Error & Record<string, unknown>;
  e.detailCode = "N6-detail";
  e.payload = { a: 1, b: [1, 2, 3] };
  throw e;
}
