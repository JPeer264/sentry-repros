// Hands every virtual user the next request of the fixed mix, in order, so the request ids are the
// ones validate.mjs looks for (`<run>-<kind>-001` ...). Artillery runs this in one process by
// default; a `--count` of more than one worker would restart the counter per worker.
const MIX = [
  { kind: 'burst', count: 50, path: '/burst?n=20' },
  { kind: 'checkout', count: 25, path: '/checkout' },
  { kind: 'detached', count: 25, path: '/detached' },
];

let next = 0;

function assignRequest(context, events, done) {
  let index = next++;
  for (const { kind, count, path } of MIX) {
    if (index < count) {
      context.vars.path = path;
      context.vars.id = `${context.vars.run}-${kind}-${String(index + 1).padStart(3, '0')}`;
      return done();
    }
    index -= count;
  }
  return done(new Error('more virtual users than requests in the mix'));
}

module.exports = { assignRequest };
