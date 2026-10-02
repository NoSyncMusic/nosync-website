import fs from 'node:fs/promises';

const [settingsRaw, contentRaw, indexRaw] = await Promise.all([
  fs.readFile('settings.json', 'utf8'),
  fs.readFile('content.json', 'utf8'),
  fs.readFile('index.html', 'utf8')
]);

const settings = JSON.parse(settingsRaw);
const content = JSON.parse(contentRaw);
const payload = JSON.stringify({ settings, content })
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026');

const pattern = /<script id="published-data" type="application\/json">[\s\S]*?<\/script>/;
if (!pattern.test(indexRaw)) {
  throw new Error('index.html is missing the published-data snapshot.');
}

const next = indexRaw.replace(
  pattern,
  `<script id="published-data" type="application/json">${payload}</script>`
);

if (next === indexRaw) {
  console.log('Homepage snapshot already current.');
} else {
  await fs.writeFile('index.html', next);
  console.log('Homepage snapshot updated.');
}
