try {
  const m = await import('koa');
  console.log(`RESULT g0-koa-nohook: ok typeof=${typeof (m.default ?? m)}`);
} catch (e) {
  console.log(`RESULT g0-koa-nohook: FAIL ${e.name}: ${e.message}`);
}
