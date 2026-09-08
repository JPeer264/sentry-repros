const target = process.argv[2];
const mod = await import(target);
const names = [
  'contextLinesIntegration',
  'dedupeIntegration',
  'extraErrorDataIntegration',
  'rewriteFramesIntegration',
  'captureConsoleIntegration',
  'featureFlagsIntegration',
  'launchDarklyIntegration',
  'openFeatureIntegration',
  'statsigIntegration',
  'unleashIntegration',
  'addFeatureFlag',
  'breadcrumbsIntegration',
];
console.log(target);
for (const n of names) console.log(`  ${n in mod ? 'YES' : 'no '} ${n}`);
