(() => {
  'use strict';

  const {
    byId,
    words,
    webUrl,
    todayInAmsterdam,
    validDate,
    hex,
    contrast,
    readableAccent
  } = window.NoSyncCore;
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


  async function init() {
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
