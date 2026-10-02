(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const PAGE_WIPE_MS = 480;
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

  function amsterdamMidnightMs(value) {
    const date = validDate(value);
    if (!date) return null;
    const [year, month, day] = value.split('-').map(Number);
    const wanted = Date.UTC(year, month - 1, day, 0, 0, 0);
    let guess = wanted;
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23'
    });
    for (let step = 0; step < 3; step += 1) {
      const parts = formatter.formatToParts(new Date(guess));
      const get = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
      const represented = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
      const delta = wanted - represented;
      guess += delta;
      if (Math.abs(delta) < 1000) break;
    }
    return guess;
  }

  function startLiveCountdown(value) {
    const host = byId('presave-countdown');
    const target = amsterdamMidnightMs(value);
    if (!host || target === null) return;

    let timer = null;
    const unit = (value, label) => {
      const wrap = document.createElement('span');
      wrap.className = 'presave-countdown-unit';
      const number = document.createElement('strong');
      number.className = 'presave-countdown-value';
      number.textContent = String(value).padStart(2, '0');
      const name = document.createElement('span');
      name.className = 'presave-countdown-label';
      name.textContent = label;
      wrap.append(number, name);
      return wrap;
    };

    const update = () => {
      const remaining = Math.max(0, target - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      host.replaceChildren(
        unit(days, days === 1 ? 'DAY' : 'DAYS'),
        unit(hours, 'HOURS'),
        unit(minutes, 'MIN'),
        unit(seconds, 'SEC')
      );
      host.setAttribute('aria-label', `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds until release`);

      if (remaining <= 0) {
        if (timer) window.clearInterval(timer);
        window.setTimeout(() => location.reload(), 900);
      }
    };

    update();
    if (target > Date.now()) timer = window.setInterval(update, 1000);
  }

  async function json(filename) {
    const response = await fetch(`${root}${filename}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load release data');
    return response.json();
  }

  function hex(value) {
    const match = words(value).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return '';
    const digits = match[1].length === 3 ? [...match[1]].map((x) => x + x).join('') : match[1];
    return `#${digits.toUpperCase()}`;
  }
  function channels(color) { return [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16)); }
  function luminance(color) {
    const rgb = channels(color).map((v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  function contrast(a, b) { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function blend(color, target, amount) {
    return '#' + channels(color).map((value, i) => Math.round(value + (channels(target)[i] - value) * amount).toString(16).padStart(2, '0')).join('');
  }
  function readableAccent(color, background, surface) {
    const score = (candidate) => Math.min(contrast(candidate, background), contrast(candidate, surface));
    let best = color;
    for (let step = 0; step <= 40; step++) {
      for (const target of ['#FFFFFF', '#000000']) {
        const candidate = blend(color, target, step / 40);
        if (score(candidate) >= 4.5) return candidate;
        if (score(candidate) > score(best)) best = candidate;
      }
    }
    return best;
  }
  function applyColors(settings) {
    const fallback = {
      accent: '#D94A4A', background: '#101010', text: '#E5E5E5', headings: '#F5F5F5',
      secondary: '#A3A3A3', buttonText: '#101010', surface: '#191919', borders: '#333333'
    };
    const colors = {};
    for (const [name, defaultValue] of Object.entries(fallback)) {
      colors[name] = hex(settings?.colors?.[name]) || defaultValue;
      document.documentElement.style.setProperty(`--${name}`, colors[name]);
    }
    document.documentElement.style.setProperty('--accent-ink', readableAccent(colors.accent, colors.background, colors.surface));
    if (contrast(colors.buttonText, colors.accent) < 4.5) {
      document.documentElement.style.setProperty('--buttonText',
        contrast('#000000', colors.accent) >= contrast('#FFFFFF', colors.accent) ? '#000000' : '#FFFFFF');
    }
    document.querySelector('meta[name="theme-color"]').content = colors.background;
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

  function setupHomeWipeNavigation() {
    document.querySelectorAll('#presave-back').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        const destination = link.href;
        if (!destination) return;

        event.preventDefault();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          window.location.assign(destination);
          return;
        }

        document.body.classList.add('is-page-wiping');
        window.setTimeout(() => window.location.assign(destination), PAGE_WIPE_MS);
      });
    });
  }

  async function init() {
    setupHomeWipeNavigation();
    try {
      const [content, settings] = await Promise.all([json('content.json'), json('settings.json')]);
      applyColors(settings);
      byId('presave-back').href = root || '/';

      const requested = requestedSlug();
      const releases = Array.isArray(content.upcomingReleases) ? content.upcomingReleases : [];
      const release = releases.find((item) => item && item.visible !== false && (words(item.slug) === requested || slugify(item.title) === requested));
      if (!release) throw new Error('This pre-save is not available.');

      const released = words(release.status, 'upcoming') === 'released'
        || (validDate(release.releaseDate) && release.releaseDate <= todayInAmsterdam());
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
        if (!released) startLiveCountdown(release.releaseDate);
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
