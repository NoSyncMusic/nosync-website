(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const rows = (value) => Array.isArray(value) ? value.filter(record) : [];
  const words = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  const names = {
    INSTAGRAM: 'Instagram', SPOTIFY: 'Spotify', YOUTUBE: 'YouTube', TIKTOK: 'TikTok',
    FACEBOOK: 'Facebook', SOUNDCLOUD: 'SoundCloud', TWITTER: 'X', APPLE_MUSIC: 'Apple Music',
    YOUTUBE_MUSIC: 'YouTube Music', DEEZER: 'Deezer', BEATPORT: 'Beatport',
    AMAZON_MUSIC: 'Amazon Music', ANGHAMMI: 'Anghami', TIDAL: 'Tidal'
  };
  const order = ['SPOTIFY', 'APPLE_MUSIC', 'BEATPORT', 'SOUNDCLOUD', 'YOUTUBE_MUSIC'];

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function setText(id, value) { byId(id).textContent = value; }
  function webUrl(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/.test(value)) return '';
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f\\]/.test(value)) return '';
    const path = value.trim().replace(/^\/media\//, 'media/');
    try {
      const url = new URL(path, document.baseURI);
      const local = url.origin === location.origin && ['http:', 'https:'].includes(url.protocol);
      return !url.username && !url.password && (local || url.protocol === 'https:') ? url.href : '';
    } catch { return ''; }
  }
  function externalLink(url, text, className, accessibleName) {
    const link = node('a', className, text);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (accessibleName) link.setAttribute('aria-label', accessibleName);
    return link;
  }
  function artwork(path) {
    const img = node('img');
    img.alt = '';
    img.width = 640;
    img.height = 640;
    img.loading = 'lazy';
    img.decoding = 'async';
    const source = imageUrl(path);
    if (source) img.src = source;
    else img.hidden = true;
    img.addEventListener('error', () => { img.hidden = true; });
    return img;
  }
  function platformLabel(link) {
    return words(link.label).trim() || names[link.type] || words(link.type, 'Listen').replaceAll('_', ' ');
  }
  function orderedLinks(value) {
    const rank = (type) => order.includes(type) ? order.indexOf(type) : order.length;
    return rows(value).map((link) => ({ ...link, url: webUrl(link.url) })).filter((link) => link.url)
      .sort((a, b) => rank(a.type) - rank(b.type));
  }
  function platformButtons(links, title, featured, label) {
    const group = node('div', 'platforms');
    const primaryCount = featured ? 3 : 2;
    const make = (link) => externalLink(link.url, platformLabel(link), 'platform-link', `${title} — ${platformLabel(link)}`);
    links.slice(0, primaryCount).forEach((link) => group.append(make(link)));
    if (links.length > primaryCount) {
      const details = node('details', 'more-platforms');
      details.append(node('summary', '', label));
      const extra = node('div', 'extra-platforms');
      links.slice(primaryCount).forEach((link) => extra.append(make(link)));
      details.append(extra);
      group.append(details);
    }
    return group;
  }
  function releaseCard(release, featured, settings) {
    const card = node('article', featured ? 'featured-release' : 'release-card');
    const links = orderedLinks(release.links);
    const title = words(release.title, 'No Sync release');
    const cover = links.length ? externalLink(links[0].url, undefined, 'release-art', `Listen to ${title}`) : node('div', 'release-art');
    cover.append(artwork(release.artwork));
    const body = node('div', 'release-body');
    if (featured && words(release.badge).trim()) body.append(node('p', 'release-badge', release.badge));
    body.append(node('h3', '', title), node('p', 'release-artist', words(release.artist)));
    body.append(platformButtons(links, title, featured, settings.music.morePlatformsLabel));
    card.append(cover, body);
    return card;
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
  function mergeSettings(source, defaults) {
    const input = record(source) ? source : {};
    const result = {};
    Object.entries(defaults).forEach(([key, fallback]) => {
      result[key] = record(fallback) ? mergeSettings(input[key], fallback) : words(input[key], fallback);
    });
    return result;
  }
  function visibility(section, visible) {
    byId(section).hidden = !visible;
    byId(`nav-${section}`).hidden = !visible;
  }
  function applySettings(settings) {
    const colors = {};
    Object.keys(snapshot.settings.colors).forEach((name) => {
      colors[name] = hex(settings.colors[name]) || snapshot.settings.colors[name];
      document.documentElement.style.setProperty(`--${name}`, colors[name]);
    });
    document.documentElement.style.setProperty('--accent-ink', readableAccent(colors.accent, colors.background, colors.surface));
    if (contrast(colors.buttonText, colors.accent) < 4.5) {
      const ink = contrast('#000000', colors.accent) >= contrast('#FFFFFF', colors.accent) ? '#000000' : '#FFFFFF';
      document.documentElement.style.setProperty('--buttonText', ink);
    }
    document.querySelector('meta[name="theme-color"]').content = colors.background;
    document.title = settings.pageTitle;
    document.querySelector('meta[name="description"]').content = settings.description;
    document.querySelector('meta[property="og:title"]').content = settings.pageTitle;
    document.querySelector('meta[property="og:description"]').content = settings.description;
    const title = settings.hero.title.replace(/\\n/g, '\n');
    const lines = title.split('\n').filter((line) => line.trim());
    byId('artist-name').replaceChildren(...(lines.length ? lines : [settings.artistName]).map((line) => node('span', 'title-line', line)));
    if (settings.hero.suffix) byId('artist-name').append(node('span', 'title-suffix', settings.hero.suffix));
    byId('artist-name').setAttribute('aria-label', `${lines.join(' ') || settings.artistName}${settings.hero.suffix}`);
    setText('tagline', settings.hero.tagline);
    setText('genres', settings.hero.genres);
    setText('hero-intro', settings.hero.intro);
    byId('hero-intro').hidden = !settings.hero.intro.trim();
    setText('photo-caption', settings.hero.photoCaption);
    byId('photo-caption').hidden = !settings.hero.photoCaption.trim();
    for (const [id, value] of [['artist-photo', settings.hero.image], ['artist-logo', settings.hero.logo]]) {
      const img = byId(id);
      const source = imageUrl(value);
      img.hidden = !source;
      img.onerror = () => { img.hidden = true; };
      if (source) img.src = source;
    }
    byId('artist-photo').alt = `${settings.artistName}, DJ and producer`;
    byId('artist-logo').alt = settings.artistName;
    byId('home-link').setAttribute('aria-label', `${settings.artistName} — home`);
    for (const [id, value] of Object.entries({
      'listen-button': settings.hero.listenButton, 'booking-button': settings.hero.bookingButton,
      'nav-music': settings.navigation.music, 'nav-links': settings.navigation.explore,
      'nav-shows': settings.navigation.shows, 'nav-contact': settings.navigation.contact,
      'music-eyebrow': settings.music.eyebrow, 'music-title': settings.music.title, 'spotify-profile': settings.music.spotifyLabel,
      'links-eyebrow': settings.links.eyebrow, 'links-title': settings.links.title,
      'shows-eyebrow': settings.shows.eyebrow, 'shows-title': settings.shows.title, 'bandsintown': settings.shows.bandsintownLabel,
      'contact-eyebrow': settings.contact.eyebrow, 'contact-title': settings.contact.title, 'presskit': settings.contact.presskitLabel,
      'footer-name': settings.footer.name, 'back-to-top': settings.footer.backToTop
    })) setText(id, value);
    setText('year', String(new Date().getFullYear()));
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }
  function todayInAmsterdam() {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type) => parts.find((entry) => entry.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function renderShows(content, settings) {
    const list = byId('show-list');
    list.replaceChildren();
    const today = todayInAmsterdam();
    const shows = rows(content.shows).filter((show) => show.visible !== false && validDate(show.date) && show.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    shows.forEach((show) => {
      const row = node('article', 'show-row');
      const date = validDate(show.date);
      const time = node('time', 'show-date');
      time.dateTime = show.date;
      time.append(node('span', 'show-day', String(date.getUTCDate()).padStart(2, '0')),
        node('span', 'show-month', new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)));
      const body = node('div', 'show-body');
      const title = words(show.title).trim();
      const displayTitle = !title || /^tba$/i.test(title) ? settings.shows.defaultTitle : title;
      body.append(node('h3', '', displayTitle));
      const venue = words(show.venue).trim();
      body.append(node('p', '', !venue || /^tba$/i.test(venue) ? settings.shows.venuePendingLabel : venue));
      if (words(show.location).trim()) body.append(node('p', 'show-location', show.location));
      const ticket = webUrl(show.ticketUrl);
      const action = show.soldOut ? node('p', 'show-status', settings.shows.soldOutLabel)
        : ticket ? externalLink(ticket, settings.shows.ticketLabel, 'button button-outline', `Tickets — ${displayTitle}`)
          : node('p', 'show-status', settings.shows.moreInfoLabel);
      row.append(time, body, action);
      list.append(row);
    });
    if (!shows.length) list.append(node('p', 'empty-message', settings.shows.emptyMessage));
  }
  function updateExternal(id, value) {
    const url = webUrl(value);
    byId(id).hidden = !url;
    if (url) byId(id).href = url;
  }

  function daysUntil(value) {
    const date = validDate(value);
    if (!date) return null;
    const today = validDate(todayInAmsterdam());
    return Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000));
  }
  function releaseSlug(release) {
    return words(release.slug).trim() || words(release.title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function releasePageUrl(release) {
    const slug = releaseSlug(release);
    return slug ? `presave/?release=${encodeURIComponent(slug)}` : '#';
  }
  function renderUpcoming(content, settings) {
    const section = byId('upcoming');
    const host = byId('upcoming-release');
    if (!section || !host) return;
    host.replaceChildren();
    const today = todayInAmsterdam();
    const list = rows(content.upcomingReleases)
      .filter((release) => release.visible !== false && words(release.status, 'upcoming') !== 'released' && validDate(release.releaseDate) && release.releaseDate >= today)
      .sort((a, b) => {
        const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        return featured || a.releaseDate.localeCompare(b.releaseDate);
      });
    const release = list[0];
    section.hidden = !release;
    if (!release) return;
    setText('upcoming-eyebrow', settings.upcoming.eyebrow);
    setText('upcoming-title', settings.upcoming.title);
    const card = node('article', 'featured-release upcoming-release-card');
    const cover = node('a', 'release-art');
    cover.href = releasePageUrl(release);
    cover.append(artwork(release.spotifyArtwork || release.artwork));
    const body = node('div', 'release-body');
    body.append(node('p', 'release-badge', 'COMING SOON'));
    body.append(node('h3', '', words(release.spotifyTitle, words(release.title, 'New release'))));
    body.append(node('p', 'release-artist', words(release.spotifyArtist, words(release.artist))));
    const date = validDate(release.releaseDate);
    const dateText = date ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date).toUpperCase() : release.releaseDate;
    body.append(node('p', 'release-date', dateText));
    const remaining = daysUntil(release.releaseDate);
    if (remaining !== null) body.append(node('p', 'release-countdown', `${remaining} ${remaining === 1 ? 'day' : 'days'} ${settings.upcoming.countdownLabel}`));
    const action = node('a', 'button button-accent', settings.upcoming.presaveLabel);
    action.href = releasePageUrl(release);
    body.append(action);
    card.append(cover, body);
    host.append(card);
  }
  function render(content, settings) {
    applySettings(settings);
    renderUpcoming(content, settings);
    byId('socials').replaceChildren();
    rows(content.socials).forEach((social) => {
      const url = webUrl(social.url);
      if (url) byId('socials').append(externalLink(url, platformLabel(social), 'social-link'));
    });
    const spotify = rows(content.socials).find((social) => social.type === 'SPOTIFY' && webUrl(social.url));
    updateExternal('spotify-profile', spotify?.url);
    const releases = rows(content.releases).filter((release) => release.visible !== false);
    const featured = releases.find((release) => release.featured) || releases[0];
    byId('featured').replaceChildren();
    byId('releases').replaceChildren();
    if (featured) byId('featured').append(releaseCard(featured, true, settings));
    releases.filter((release) => release !== featured).forEach((release) => byId('releases').append(releaseCard(release, false, settings)));
    visibility('music', releases.length > 0);
    byId('listen-button').hidden = !releases.length;
    byId('link-grid').replaceChildren();
    rows(content.links).filter((link) => link.visible !== false && webUrl(link.url)).forEach((link) => {
      const card = externalLink(webUrl(link.url), undefined, 'link-card');
      const image = node('span', 'link-art');
      image.append(artwork(link.image));
      const body = node('span', 'link-body');
      body.append(node('span', 'link-title', words(link.title, 'Explore')));
      if (words(link.subtitle).trim()) body.append(node('span', 'link-subtitle', link.subtitle));
      const arrow = node('span', 'link-arrow', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      card.append(image, body, arrow);
      byId('link-grid').append(card);
    });
    visibility('links', byId('link-grid').childElementCount > 0);
    renderShows(content, settings);
    document.dispatchEvent(new CustomEvent('nosync:content-ready', { detail: { content, settings } }));
    updateExternal('bandsintown', content.bandsintown);
    updateExternal('presskit', content.presskit);
    byId('contacts').replaceChildren();
    rows(content.contacts).forEach((contact) => {
      const email = words(contact.email).trim();
      if (!/^[^\s<>@?&]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return;
      const item = node('div', 'contact-card');
      item.append(node('p', 'contact-label', words(contact.label)));
      const address = node('a', 'contact-email', email);
      address.href = `mailto:${email}`;
      item.append(address);
      if (words(contact.note).trim()) item.append(node('p', 'contact-note', contact.note));
      byId('contacts').append(item);
    });
  }
  async function freshJson(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Unavailable');
      const value = await response.json();
      if (!record(value)) throw new Error('Invalid data');
      return value;
    } finally { clearTimeout(timeout); }
  }
  const snapshot = JSON.parse(byId('published-data').textContent);
  applySettings(snapshot.settings);
  Promise.allSettled([freshJson('content.json'), freshJson('settings.json')]).then(([content, settings]) => {
    render(content.status === 'fulfilled' ? content.value : snapshot.content,
      mergeSettings(settings.status === 'fulfilled' ? settings.value : {}, snapshot.settings));
  });
})();
