import { readFileSync } from 'node:fs';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

const [, , mapPath, ...positions] = process.argv;
const map = new TraceMap(JSON.parse(readFileSync(mapPath, 'utf8')));
for (const pos of positions) {
  const [line, column] = pos.split(':').map(Number);
  const orig = originalPositionFor(map, { line, column });
  console.log(`${pos} -> ${orig.source}:${orig.line}:${orig.column}`);
}
