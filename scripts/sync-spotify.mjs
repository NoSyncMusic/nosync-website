import fs from 'node:fs/promises';

const artistId = process.env.SPOTIFY_ARTIST_ID || '6jG0cf5NUIIkxydJ9zTa8B';
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required.');
  process.exit(1);
}

const normalizeIsrc = (value = '') => String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
const contentPath = new URL('../content.json', import.meta.url);

async function token() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) throw new Error(`Spotify token request failed: ${response.status}`);
  return (await response.json()).access_token;
}

async function findTrack(accessToken, isrc) {
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', `isrc:${isrc}`);
  url.searchParams.set('type', 'track');
  url.searchParams.set('market', 'NL');
  url.searchParams.set('limit', '10');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Spotify search failed: ${response.status}`);
  const payload = await response.json();
  const items = payload?.tracks?.items || [];
  return items.find((track) =>
    normalizeIsrc(track?.external_ids?.isrc) === isrc &&
    Array.isArray(track?.artists) &&
    track.artists.some((artist) => artist?.id === artistId)
  ) || null;
}

const raw = await fs.readFile(contentPath, 'utf8');
const data = JSON.parse(raw);
data.upcomingReleases = Array.isArray(data.upcomingReleases) ? data.upcomingReleases : [];
data.releases = Array.isArray(data.releases) ? data.releases : [];

const accessToken = await token();
let changed = false;

for (const upcoming of data.upcomingReleases) {
  if (!upcoming || upcoming.visible === false || upcoming.status === 'released') continue;
  const isrc = normalizeIsrc(upcoming.isrc);
  if (!isrc) continue;

  const track = await findTrack(accessToken, isrc);
  if (!track) {
    console.log(`Not on Spotify yet: ${upcoming.title || isrc}`);
    continue;
  }

  const spotifyUrl = track.external_urls?.spotify || '';
  const artwork = track.album?.images?.[0]?.url || '';
  const artist = (track.artists || []).map((item) => item.name).filter(Boolean).join(' & ');
  const releaseDate = track.album?.release_date || upcoming.releaseDate || '';

  Object.assign(upcoming, {
    status: 'released',
    spotifyTrackId: track.id,
    spotifyUrl,
    spotifyArtwork: artwork,
    spotifyTitle: track.name,
    spotifyArtist: artist,
    spotifyReleaseDate: releaseDate
  });

  const existing = data.releases.find((release) =>
    release?.spotifyTrackId === track.id ||
    normalizeIsrc(release?.isrc) === isrc ||
    (release?.links || []).some((link) => link?.type === 'SPOTIFY' && link?.url === spotifyUrl)
  );

  if (upcoming.featured) {
    for (const release of data.releases) release.featured = false;
  }

  const releaseData = {
    isrc,
    spotifyTrackId: track.id,
    releaseDate,
    title: track.name,
    artist,
    artwork: artwork || upcoming.artwork || '',
    featured: Boolean(upcoming.featured),
    badge: 'OUT NOW',
    visible: true,
    links: [{ type: 'SPOTIFY', url: spotifyUrl }]
  };

  if (existing) Object.assign(existing, releaseData);
  else data.releases.unshift(releaseData);

  changed = true;
  console.log(`Released: ${track.name} (${isrc})`);
}

if (changed) {
  await fs.writeFile(contentPath, JSON.stringify(data, null, 2) + '\n');
  console.log('content.json updated.');
} else {
  console.log('No release changes found.');
}
