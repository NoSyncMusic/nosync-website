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

const socialUrls = (Array.isArray(content.socials) ? content.socials : [])
  .map((item) => String(item?.url || '').trim())
  .filter((url) => /^https:\/\//i.test(url));

const artistSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: settings.artistName || 'No Sync',
  url: 'https://nosyncmusic.com/',
  description: settings.description || '',
  image: /^https:\/\//i.test(settings?.hero?.image || '')
    ? settings.hero.image
    : 'https://nosyncmusic.com/' + String(settings?.hero?.image || 'media/artist.webp').replace(/^\/+/, ''),
  genre: String(settings?.hero?.genres || '')
    .split('·')
    .map((item) => item.trim())
    .filter(Boolean),
  sameAs: socialUrls
})
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026');

const pattern = /<script id="published-data" type="application\/json">[\s\S]*?<\/script>/;
if (!pattern.test(indexRaw)) {
  throw new Error('index.html is missing the published-data snapshot.');
}

let next = indexRaw.replace(
  pattern,
  `<script id="published-data" type="application/json">${payload}</script>`
);

const schemaTag = `<script id="artist-schema" type="application/ld+json">${artistSchema}</script>`;
const schemaPattern = /<script id="artist-schema" type="application\/ld\+json">[\s\S]*?<\/script>/;
if (schemaPattern.test(next)) {
  next = next.replace(schemaPattern, schemaTag);
} else {
  next = next.replace('</head>', `  ${schemaTag}\n</head>`);
}

if (next === indexRaw) {
  console.log('Homepage snapshot already current.');
} else {
  await fs.writeFile('index.html', next);
  console.log('Homepage snapshot updated.');
}
