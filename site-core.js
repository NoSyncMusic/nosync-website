(() => {
  'use strict';

  const platformNames = {
    INSTAGRAM: 'Instagram',
    SPOTIFY: 'Spotify',
    YOUTUBE: 'YouTube',
    TIKTOK: 'TikTok',
    FACEBOOK: 'Facebook',
    SOUNDCLOUD: 'SoundCloud',
    TWITTER: 'X',
    APPLE_MUSIC: 'Apple Music',
    YOUTUBE_MUSIC: 'YouTube Music',
    DEEZER: 'Deezer',
    BEATPORT: 'Beatport',
    AMAZON_MUSIC: 'Amazon Music',
    ANGHAMMI: 'Anghami',
    TIDAL: 'Tidal',
    AUDIOMACK: 'Audiomack',
    SMART_LINK: 'All platforms',
    OTHER: 'Other'
  };

  const platformOrder = [
    'SMART_LINK', 'SPOTIFY', 'APPLE_MUSIC', 'AMAZON_MUSIC', 'YOUTUBE_MUSIC',
    'DEEZER', 'TIDAL', 'SOUNDCLOUD', 'AUDIOMACK', 'ANGHAMMI', 'BEATPORT', 'OTHER'
  ];

  const byId = (id) => document.getElementById(id);
  const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const rows = (value) => Array.isArray(value) ? value.filter(record) : [];
  const words = (value, fallback = '') => typeof value === 'string' ? value : fallback;

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
    } catch {
      return '';
    }
  }

  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f\\]/.test(value)) return '';
    const path = value.trim().replace(/^\/media\//, 'media/');
    try {
      const url = new URL(path, document.baseURI);
      const local = url.origin === location.origin && ['http:', 'https:'].includes(url.protocol);
      return !url.username && !url.password && (local || url.protocol === 'https:') ? url.href : '';
    } catch {
      return '';
    }
  }

  function artwork(path, size = 640) {
    const img = node('img');
    img.alt = '';
    img.width = size;
    img.height = size;
    img.loading = 'lazy';
    img.decoding = 'async';
    const source = imageUrl(path);
    if (source) img.src = source;
    else img.hidden = true;
    img.addEventListener('error', () => { img.hidden = true; });
    return img;
  }

  function platformLabel(link) {
    return words(link?.label).trim()
      || platformNames[link?.type]
      || words(link?.type, 'Listen').replaceAll('_', ' ');
  }

  function orderedLinks(value) {
    const rank = (type) => platformOrder.includes(type) ? platformOrder.indexOf(type) : platformOrder.length;
    return rows(value)
      .map((link) => ({ ...link, url: webUrl(link.url) }))
      .filter((link) => link.url)
      .sort((a, b) => rank(a.type) - rank(b.type));
  }

  function uniqueLinks(value) {
    const seen = new Set();
    return orderedLinks(value).filter((link) => {
      const type = words(link.type).trim();
      const key = type && type !== 'OTHER'
        ? `type:${type}`
        : `other:${platformLabel(link).toLowerCase()}|${link.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function todayInAmsterdam() {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const part = (type) => parts.find((entry) => entry.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }

  function formatReleaseDate(value) {
    const date = validDate(value);
    if (!date) return '';
    return `Released ${new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date)}`;
  }

  function formatCardDate(value) {
    const date = validDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date).toUpperCase();
  }

  function hex(value) {
    const match = words(value).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return '';
    const digits = match[1].length === 3
      ? [...match[1]].map((part) => part + part).join('')
      : match[1];
    return `#${digits.toUpperCase()}`;
  }

  function channels(color) {
    return [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
  }

  function luminance(color) {
    const rgb = channels(color).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function contrast(a, b) {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  }

  function blend(a, b, amount) {
    const ac = channels(a);
    const bc = channels(b);
    return '#' + ac.map((value, index) =>
      Math.round(value + (bc[index] - value) * amount).toString(16).padStart(2, '0')
    ).join('').toUpperCase();
  }

  function readableAccent(color, background, surface = background) {
    const score = (candidate) => Math.min(contrast(candidate, background), contrast(candidate, surface));
    let best = color;
    for (let step = 0; step <= 40; step += 1) {
      for (const target of ['#FFFFFF', '#000000']) {
        const candidate = blend(color, target, step / 40);
        if (score(candidate) >= 4.5) return candidate;
        if (score(candidate) > score(best)) best = candidate;
      }
    }
    return best;
  }

  window.NoSyncCore = Object.freeze({
    platformNames,
    platformOrder,
    byId,
    record,
    rows,
    words,
    node,
    webUrl,
    imageUrl,
    artwork,
    platformLabel,
    orderedLinks,
    uniqueLinks,
    todayInAmsterdam,
    validDate,
    formatReleaseDate,
    formatCardDate,
    hex,
    channels,
    luminance,
    contrast,
    blend,
    readableAccent
  });
})();
