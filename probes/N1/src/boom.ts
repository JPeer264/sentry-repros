// Three nested frames so the event carries more than one in-app frame and the
// difference between "context lines under ./src" and "context lines on the
// entry file one directory up" is visible in a single event.

export function level3(): never {
  throw new Error('n1 nested boom');
}

export function level2(): never {
  return level3();
}

export function boom(): never {
  return level2();
}
