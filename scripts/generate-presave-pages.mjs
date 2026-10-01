import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const content = JSON.parse(await fs.readFile(path.join(root, 'content.json'), 'utf8'));
const template = await fs.readFile(path.join(root, 'presave', 'index.html'), 'utf8');
const releases = Array.isArray(content.upcomingReleases) ? content.upcomingReleases : [];
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const active = new Set();

function nestedPage(slug) {
  return template
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="presave-release" content="' + slug + '">\n  <!-- generated-presave-page -->')
    .replaceAll('href="../media/', 'href="../../media/')
    .replaceAll('href="../styles.css', 'href="../../styles.css')
    .replaceAll('src="presave.js', 'src="../presave.js')
    .replace('id="presave-back" href="../"', 'id="presave-back" href="../../"');
}

for (const release of releases) {
  if (!release || release.visible === false) continue;
  const slug = String(release.slug || '').trim();
  if (!validSlug.test(slug)) continue;
  active.add(slug);
  const dir = path.join(root, 'presave', slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), nestedPage(slug));
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
