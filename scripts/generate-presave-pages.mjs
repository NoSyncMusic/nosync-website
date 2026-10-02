import fs from 'node:fs/promises';
import path from 'node:path';

// Generated pages are static share targets with release-specific social metadata.

const root = process.cwd();
const content = JSON.parse(await fs.readFile(path.join(root, 'content.json'), 'utf8'));
const template = await fs.readFile(path.join(root, 'presave', 'index.html'), 'utf8');
const releases = Array.isArray(content.upcomingReleases) ? content.upcomingReleases : [];
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const active = new Set();

const htmlEscape = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function displayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(date);
}

function publicArtwork(release) {
  const raw = String(release.spotifyArtwork || release.artwork || '').trim();
  if (/^https:\/\//i.test(raw)) return raw;
  if (!raw) return 'https://nosyncmusic.com/media/social-preview.jpg';
  return 'https://nosyncmusic.com/' + raw.replace(/^\/+/, '');
}

function nestedPage(release, slug) {
  const title = String(release.spotifyTitle || release.title || 'No Sync release').trim();
  const artist = String(release.spotifyArtist || release.artist || 'No Sync').trim();
  const date = displayDate(release.spotifyReleaseDate || release.releaseDate);
  const isReleased = String(release.status || 'upcoming') === 'released';
  const description = isReleased
    ? `Listen to ${title} by ${artist} on your preferred streaming service.`
    : `Pre-save ${title} by ${artist}${date ? `. Releasing ${date}.` : '.'}`;
  const canonical = `https://nosyncmusic.com/presave/${slug}/`;
  const artwork = publicArtwork(release);
  const pageTitle = `${title} — ${artist}`;

  const socialMeta = [
    `  <link rel="canonical" href="${htmlEscape(canonical)}">`,
    '  <meta property="og:type" content="music.song">',
    '  <meta property="og:site_name" content="No Sync">',
    `  <meta property="og:title" content="${htmlEscape(pageTitle)}">`,
    `  <meta property="og:description" content="${htmlEscape(description)}">`,
    `  <meta property="og:url" content="${htmlEscape(canonical)}">`,
    `  <meta property="og:image" content="${htmlEscape(artwork)}">`,
    `  <meta property="og:image:alt" content="${htmlEscape(title + ' artwork')}">`,
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:title" content="${htmlEscape(pageTitle)}">`,
    `  <meta name="twitter:description" content="${htmlEscape(description)}">`,
    `  <meta name="twitter:image" content="${htmlEscape(artwork)}">`
  ].join('\n');

  return template
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="presave-release" content="' + htmlEscape(slug) + '">\n  <!-- generated-presave-page -->')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + htmlEscape(description) + '">\n' + socialMeta)
    .replace(/<title>[\s\S]*?<\/title>/, '<title>' + htmlEscape(pageTitle) + '</title>')
    .replaceAll('href="../favicon.', 'href="../../favicon.')
    .replaceAll('href="../apple-touch-icon.png', 'href="../../apple-touch-icon.png')
    .replaceAll('href="../styles.css', 'href="../../styles.css')
    .replaceAll('src="presave.js', 'src="../presave.js')
    .replaceAll('src="../page-transitions.js', 'src="../../page-transitions.js')
    .replaceAll('src="../site-core.js', 'src="../../site-core.js')
    .replace('id="presave-back" href="../"', 'id="presave-back" href="../../"');
}

for (const release of releases) {
  if (!release || release.visible === false) continue;
  const slug = String(release.slug || '').trim();
  if (!validSlug.test(slug)) continue;
  active.add(slug);
  const dir = path.join(root, 'presave', slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), nestedPage(release, slug));
  console.log('Generated:', 'presave/' + slug + '/index.html');
}

for (const entry of await fs.readdir(path.join(root, 'presave'), { withFileTypes: true })) {
  if (!entry.isDirectory() || active.has(entry.name)) continue;
  const file = path.join(root, 'presave', entry.name, 'index.html');
  try {
    const current = await fs.readFile(file, 'utf8');
    if (current.includes('generated-presave-page')) {
      await fs.rm(path.join(root, 'presave', entry.name), { recursive: true, force: true });
      console.log('Removed stale generated page:', entry.name);
    }
  } catch {}
}


const sitemapUrls = [
  'https://nosyncmusic.com/',
  'https://nosyncmusic.com/releases/',
  ...[...active].sort().map((slug) => `https://nosyncmusic.com/presave/${slug}/`)
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapUrls.flatMap((url) => [
    '  <url>',
    `    <loc>${url}</loc>`,
    '  </url>'
  ]),
  '</urlset>',
  ''
].join('\n');

await fs.writeFile(path.join(root, 'sitemap.xml'), sitemap);
console.log('Sitemap updated.');
