(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const rows = (value) => Array.isArray(value) ? value.filter(record) : [];
  const words = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  const names = {
    SPOTIFY: 'Spotify', APPLE_MUSIC: 'Apple Music', YOUTUBE_MUSIC: 'YouTube Music',
    DEEZER: 'Deezer', BEATPORT: 'Beatport', SOUNDCLOUD: 'SoundCloud',
    AMAZON_MUSIC: 'Amazon Music', AUDIOMACK: 'Audiomack', ANGHAMMI: 'Anghami',
    TIDAL: 'Tidal', SMART_LINK: 'All platforms'
  };
  const order = ['SMART_LINK', 'SPOTIFY', 'APPLE_MUSIC', 'AMAZON_MUSIC', 'YOUTUBE_MUSIC', 'DEEZER', 'TIDAL', 'SOUNDCLOUD', 'AUDIOMACK', 'ANGHAMMI', 'BEATPORT'];
  const STREAM_MODAL_ANIMATION_MS = 260;
  let streamModalReturnFocus = null;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
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
  function externalLink(url, className, accessibleName) {
    const link = node('a', className);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (accessibleName) link.setAttribute('aria-label', accessibleName);
    return link;
  }
  function platformLabel(link) {
    return words(link.label).trim() || names[link.type] || words(link.type, 'Listen').replaceAll('_', ' ');
  }
  function orderedLinks(value) {
    const rank = (type) => order.includes(type) ? order.indexOf(type) : order.length;
    return rows(value).map((link) => ({ ...link, url: webUrl(link.url) })).filter((link) => link.url)
      .sort((a, b) => rank(a.type) - rank(b.type));
  }
  function uniqueLinks(value) {
    const seen = new Set();
    return orderedLinks(value).filter((link) => {
      const key = `${link.type || ''}|${link.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function todayInAmsterdam() {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type) => parts.find((entry) => entry.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  function releaseIdentity(release) {
    const clean = (value) => words(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
    return `${clean(release.title)}|${clean(release.artist)}`;
  }
  function releaseFromUpcoming(release) {
    const links = [...rows(release.links)];
    const smartLink = webUrl(release.smartLinkUrl) || webUrl(release.presaveUrl);
    const spotify = webUrl(release.spotifyUrl);
    if (smartLink) links.unshift({ type: 'SMART_LINK', url: smartLink });
    if (spotify) links.push({ type: 'SPOTIFY', url: spotify });
    return {
      title: words(release.spotifyTitle, words(release.title, 'New release')),
      artist: words(release.spotifyArtist, words(release.artist)),
      artwork: words(release.spotifyArtwork, words(release.artwork)),
      badge: 'OUT NOW',
      visible: release.visible !== false,
      links,
      _releaseDate: words(release.spotifyReleaseDate, words(release.releaseDate))
    };
  }
  function allReleases(content) {
    const today = todayInAmsterdam();
    const manual = rows(content.releases).filter((release) => release.visible !== false);
    const automatic = rows(content.upcomingReleases)
      .filter((release) => release.visible !== false && validDate(release.releaseDate)
        && (words(release.status, 'upcoming') === 'released' || release.releaseDate <= today))
      .map(releaseFromUpcoming)
      .sort((a, b) => words(b._releaseDate).localeCompare(words(a._releaseDate)));
    const releases = [...manual];
    automatic.slice().reverse().forEach((automaticRelease) => {
      const key = releaseIdentity(automaticRelease);
      const existingIndex = releases.findIndex((release) => releaseIdentity(release) === key);
      if (existingIndex >= 0) {
        const existing = releases.splice(existingIndex, 1)[0];
        releases.unshift({ ...existing, ...automaticRelease, links: [...rows(existing.links), ...rows(automaticRelease.links)] });
      } else releases.unshift(automaticRelease);
    });
    return releases;
  }
  function closeStreamModal() {
    const modal = byId('stream-modal');
    if (!modal || modal.hidden || modal.dataset.closing === 'true') return;
    modal.dataset.closing = 'true';
    modal.classList.remove('is-open');
    document.body.classList.remove('stream-modal-open');
    const target = streamModalReturnFocus;
    streamModalReturnFocus = null;
    window.setTimeout(() => {
      modal.hidden = true;
      modal.dataset.closing = 'false';
      if (target && document.contains(target)) target.focus();
    }, STREAM_MODAL_ANIMATION_MS);
  }
  function ensureStreamModal() {
    let modal = byId('stream-modal');
    if (modal) return modal;
    modal = node('div', 'stream-modal');
    modal.id = 'stream-modal';
    modal.hidden = true;
    modal.addEventListener('click', (event) => { if (event.target === modal) closeStreamModal(); });
    document.addEventListener('keydown', (event) => {
      if (modal.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeStreamModal();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('a[href], button:not([disabled])')].filter((item) => !item.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.body.append(modal);
    return modal;
  }
  function openStreamModal(release, settings) {
    const links = uniqueLinks(release.links);
    if (!links.length) return;
    const modal = ensureStreamModal();
    const title = words(release.title, 'No Sync release');
    const panel = node('section', 'stream-modal-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'stream-modal-title');
    const header = node('div', 'stream-modal-header');
    header.append(node('p', 'eyebrow', words(settings?.music?.streamModalEyebrow, 'LISTEN NOW')));
    const close = node('button', 'stream-modal-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', words(settings?.music?.closeModalLabel, 'Close'));
    close.addEventListener('click', closeStreamModal);
    header.append(close);
    const releaseRow = node('div', 'stream-modal-release');
    const art = node('div', 'stream-modal-art');
    art.append(artwork(release.artwork));
    const copy = node('div', 'stream-modal-copy');
    const heading = node('h2', '', title);
    heading.id = 'stream-modal-title';
    copy.append(heading, node('p', 'release-artist', words(release.artist)));
    releaseRow.append(art, copy);
    const servicesTitle = node('p', 'stream-modal-services-title', words(settings?.music?.streamModalTitle, 'Choose your platform'));
    const services = node('div', 'stream-service-list');
    links.forEach((link) => {
      const label = platformLabel(link);
      const service = externalLink(link.url, 'stream-service', `${title} — ${label}`);
      service.append(node('span', 'stream-service-name', label), node('span', 'stream-service-action', words(settings?.music?.openPlatformLabel, 'Open ↗')));
      services.append(service);
    });
    panel.append(header, releaseRow, servicesTitle, services);
    modal.replaceChildren(panel);
    streamModalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.dataset.closing = 'false';
    modal.hidden = false;
    document.body.classList.add('stream-modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    close.focus();
  }
  function releaseCard(release, settings) {
    const card = node('article', 'release-card');
    const links = uniqueLinks(release.links);
    const title = words(release.title, 'No Sync release');
    const cover = links.length ? node('button', 'release-art release-art-button') : node('div', 'release-art');
    if (links.length) {
      cover.type = 'button';
      cover.setAttribute('aria-label', `${words(settings?.music?.streamHereLabel, 'Stream here')} — ${title}`);
      cover.addEventListener('click', () => openStreamModal(release, settings));
    }
    cover.append(artwork(release.artwork));
    const body = node('div', 'release-body');
    body.append(node('h3', '', title), node('p', 'release-artist', words(release.artist)));
    if (links.length) {
      const action = node('button', 'button button-accent stream-here-button', words(settings?.music?.streamHereLabel, 'Stream here'));
      action.type = 'button';
      action.addEventListener('click', () => openStreamModal(release, settings));
      body.append(action);
    }
    card.append(cover, body);
    return card;
  }
  function applySettings(settings) {
    const colors = settings?.colors || {};
    for (const [name, value] of Object.entries(colors)) {
      if (typeof value === 'string' && /^#?[0-9a-f]{3,6}$/i.test(value.trim())) {
        document.documentElement.style.setProperty(`--${name}`, value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`);
      }
    }
    byId('archive-eyebrow').textContent = words(settings?.music?.allReleasesEyebrow, 'DISCOGRAPHY');
    byId('archive-title').textContent = words(settings?.music?.allReleasesTitle, 'All releases.');
    byId('archive-logo').alt = words(settings?.artistName, 'No Sync');
    document.querySelector('meta[name="theme-color"]').content = colors.background || '#101010';
  }
  async function json(path) {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load releases');
    const value = await response.json();
    if (!record(value)) throw new Error('Invalid release data');
    return value;
  }
  async function init() {
    byId('archive-year').textContent = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Amsterdam', year: 'numeric' }).format(new Date());
    try {
      const [content, settings] = await Promise.all([json('content.json'), json('settings.json')]);
      applySettings(settings);
      const releases = allReleases(content);
      const host = byId('all-releases');
      host.replaceChildren();
      releases.forEach((release) => host.append(releaseCard(release, settings)));
      byId('archive-status').hidden = releases.length > 0;
      if (!releases.length) byId('archive-status').textContent = 'No releases available yet.';
    } catch (error) {
      byId('archive-status').textContent = error instanceof Error ? error.message : 'Could not load releases.';
    }
  }
  init();
})();
