// Builds a single self-contained HTML file (dist + STL assets inlined as
// data: URIs) for publishing as a Claude Artifact, which can't fetch
// separate files.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = new URL('./dist', import.meta.url).pathname;
const modelsDir = new URL('./public/models', import.meta.url).pathname;
const outPath = process.argv[2];
if (!outPath) {
  console.error('Usage: node build-artifact.mjs <output.html>');
  process.exit(1);
}

const assetsDir = join(distDir, 'assets');
const files = readdirSync(assetsDir);
const cssFile = files.find((f) => f.endsWith('.css'));
const jsFile = files.find((f) => f.endsWith('.js'));

const modelAssets = {};
for (const f of readdirSync(modelsDir)) {
  const data = readFileSync(join(modelsDir, f));
  modelAssets[f] = `data:application/octet-stream;base64,${data.toString('base64')}`;
}

const css = readFileSync(join(assetsDir, cssFile), 'utf8');
const js = readFileSync(join(assetsDir, jsFile), 'utf8');

const html = `<meta charset="utf-8">
<title>Melfa RV-2AJ · Simulador Web</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
${css}
</style>
<div id="root"></div>
<script>window.__MODEL_ASSETS__ = ${JSON.stringify(modelAssets)};</script>
<script type="module">
${js}
</script>
`;

writeFileSync(outPath, html);
console.log(`Wrote ${outPath} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
