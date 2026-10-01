(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const words = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  const serviceNames = {
    SPOTIFY: 'Spotify',
    APPLE_MUSIC: 'Apple Music',
    AMAZON_MUSIC: 'Amazon Music',
    YOUTUBE_MUSIC: 'YouTube Music',
    DEEZER: 'Deezer',
    TIDAL: 'TIDAL',
    SOUNDCLOUD: 'SoundCloud',
    AUDIOMACK: 'Audiomack',
    ANGHAMMI: 'Anghami'
  };
  const defaultServices = Object.keys(serviceNames);

  function siteRoot() {
    const marker = '/presave/';
    const i = location.pathname.indexOf(marker);
    if (i >= 0) return location.pathname.slice(0, i + 1);
    return location.pathname.replace(/[^/]*$/, '');
  }

  const root = siteRoot();

  const webUrl = (value) => {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  };

  const imageUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const raw = value.trim();
      if (/^https:\/\//i.test(raw)) return webUrl(raw);
      const clean = raw.replace(/^\/?/, '');
      return new URL(root + clean, location.origin).href;
    } catch { return ''; }
  };

  const slugify = (value) => words(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function todayInAmsterdam() {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function daysUntil(value) {
    const target = validDate(value);
    const today = validDate(todayInAmsterdam());
    if (!target || !today) return null;
    return Math.max(0, Math.ceil((target - today) / 86400000));
  }

  async function json(filename) {
    const response = await fetch(`${root}${filename}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load release data');
    return response.json();
  }

  function applyColors(settings) {
    const colors = settings?.colors || {};
    for (const [name, value] of Object.entries(colors)) {
      if (typeof value === 'string' && /^#?[0-9a-f]{3,6}$/i.test(value.trim())) {
        document.documentElement.style.setProperty(`--${name}`, value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`);
      }
    }
  }

  function requestedSlug() {
    const query = new URLSearchParams(location.search).get('release');
    if (query) return query;
    const meta = document.querySelector('meta[name="presave-release"]')?.content;
    if (meta) return meta;
    const parts = location.pathname.split('/').filter(Boolean);
    const index = parts.lastIndexOf('presave');
    return index >= 0 ? words(parts[index + 1]) : '';
  }

  function renderServices(release, settings, released) {
    const services = Array.isArray(release.enabledServices) && release.enabledServices.length
      ? release.enabledServices.filter((item) => serviceNames[item])
      : defaultServices;
    const host = byId('presave-services');
    host.replaceChildren();

    services.forEach((service) => {
      const item = document.createElement('span');
      item.className = 'presave-service';
      const name = document.createElement('span');
      name.className = 'presave-service-name';
      name.textContent = serviceNames[service];
      item.append(name);
      host.append(item);
    });

    byId('presave-services-label').textContent = released ? 'Available on your streaming services' : (settings?.upcoming?.servicesLabel || 'Pre-save available on');
    byId('presave-services-wrap').hidden = !services.length;
  }

  async function init() {
    try {
      const [content, settings] = await Promise.all([json('content.json'), json('settings.json')]);
      applyColors(settings);
      byId('presave-back').href = root || '/';

      const requested = requestedSlug();
      const releases = Array.isArray(content.upcomingReleases) ? content.upcomingReleases : [];
      const release = releases.find((item) => item && item.visible !== false && (words(item.slug) === requested || slugify(item.title) === requested));
      if (!release) throw new Error('This pre-save is not available.');

      const released = words(release.status, 'upcoming') === 'released';
      const title = words(release.spotifyTitle, words(release.title, 'New release'));
      const artist = words(release.spotifyArtist, words(release.artist, 'No Sync'));
      const smartLink = webUrl(release.smartLinkUrl) || webUrl(release.presaveUrl);
      const actionUrl = smartLink || (released ? webUrl(release.spotifyUrl) : '');
      const artwork = imageUrl(release.spotifyArtwork || release.artwork);

      document.title = `${title} — No Sync`;
      document.querySelector('meta[name="description"]').content = released
        ? `Listen to ${title} by ${artist} on your preferred streaming service.`
        : `Pre-save ${title} by ${artist} on your preferred streaming service.`;

      byId('presave-title').textContent = title;
      byId('presave-artist').textContent = artist;
      byId('presave-eyebrow').textContent = released ? 'OUT NOW' : 'COMING SOON';

      if (artwork) {
        byId('presave-art').src = artwork;
        byId('presave-art').alt = `${title} artwork`;
      } else {
        byId('presave-art').hidden = true;
      }

      const date = validDate(release.releaseDate);
      if (date) {
        byId('presave-date').textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date).toUpperCase();
        const left = daysUntil(release.releaseDate);
        if (!released && left !== null) byId('presave-countdown').textContent = left === 0 ? 'RELEASE DAY' : `${left} ${left === 1 ? 'DAY' : 'DAYS'} TO GO`;
      }

      const button = byId('presave-action');
      button.textContent = released ? (settings?.upcoming?.releasedLabel || 'Listen on all platforms') : (settings?.upcoming?.presaveLabel || 'Choose your platform');
      if (actionUrl) {
        button.href = actionUrl;
        button.target = '_blank';
      } else {
        button.hidden = true;
      }

      renderServices(release, settings, released);

      const note = byId('presave-note');
      if (!released && words(settings?.upcoming?.followNote).trim()) {
        note.textContent = settings.upcoming.followNote;
        note.hidden = false;
      }

      byId('presave-card').hidden = false;
      byId('presave-status').hidden = true;
    } catch (error) {
      byId('presave-status').textContent = error instanceof Error ? error.message : 'This pre-save is unavailable.';
    }
  }

  init();
})();
