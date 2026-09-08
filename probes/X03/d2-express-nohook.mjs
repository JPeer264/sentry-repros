let result;
try {
  const m = await import('express');
  result = `ok typeof=${typeof (m.default ?? m)}`;
} catch (e) {
  result = `FAIL ${e.name}: ${e.message}`;
}
console.log(`RESULT d2-express-nohook: ${result}`);
