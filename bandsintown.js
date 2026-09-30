(() => {
  'use strict';
  // The official widget owns fetching and rendering published Bandsintown events.
  // Initialise after our CMS settings arrive so the widget uses the current theme.
  document.addEventListener('nosync:content-ready', (event) => {
    const { content, settings } = event.detail;
    if (settings.shows.source !== 'bandsintown') return;
    let artistId;
    try {
      const url = new URL(content.bandsintown);
      if (url.protocol !== 'https:' || !['bandsintown.com', 'www.bandsintown.com'].includes(url.hostname)) return;
      artistId = url.pathname.match(/^\/a\/(\d+)(?:[-/]|$)/)?.[1];
    } catch { return; }
    if (!artistId) return;
    const fallback = document.getElementById('show-list');
    const host = document.getElementById('bandsintown-events');
    const status = document.getElementById('shows-loading');
    fallback.hidden = true;
    host.hidden = false;

    function load() {
      status.hidden = false;
      status.textContent = settings.shows.loadingLabel;
      const theme = getComputedStyle(document.documentElement);
      const color = (name) => theme.getPropertyValue(`--${name}`).trim();
      const initializer = document.createElement('a');
      initializer.className = 'bit-widget-initializer';
      const options = {
        'artist-name': `id_${artistId}`,
        'auto-style': 'false',
        'font': 'DM Sans',
        'google-font': 'false',
        'font-size': '16px',
        'background-color': color('background'),
        'text-color': color('text'),
        'separator-color': color('borders'),
        'link-color': color('accent'),
        'link-text-color': color('buttonText'),
        'accent-color': color('accent-ink'),
        'display-local-dates': 'false',
        'display-past-dates': 'false',
        'display-limit': 'all',
        'display-logo': 'true',
        'display-lineup': 'false',
        'display-details': 'false',
        'display-start-time': 'false',
        'display-play-my-city': 'false',
        'display-follow-section': 'false',
        'follow-section-position': 'hidden',
        'play-my-city-position': 'hidden',
        'social-share-icon': 'false',
        'event-rsvp-position': 'hidden',
        'event-ticket-cta-text': settings.shows.ticketLabel,
        'event-ticket-cta-text-color': color('buttonText'),
        'event-ticket-cta-bg-color': color('accent'),
        'event-ticket-cta-border-color': color('accent'),
        'event-ticket-cta-border-radius': '3px',
        'language': 'en'
      };
      for (const [key, value] of Object.entries(options)) initializer.setAttribute(`data-${key}`, value);
      host.append(initializer);
      let completed = false;
      let timeout;
      function failure(stop = false) {
        if (completed) return;
        clearTimeout(timeout);
        if (stop) { completed = true; observer.disconnect(); }
        host.hidden = true;
        status.hidden = true;
        // Keep the current CMS dates as a reserve and provide the live artist link.
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = `https://www.bandsintown.com/a/${artistId}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = settings.shows.fallbackLabel;
        link.dataset.bandsintownFallback = 'true';
        if (!fallback.querySelector('[data-bandsintown-fallback]')) fallback.append(link);
        fallback.hidden = false;
      }
      const observer = new MutationObserver(() => {
        const widget = host.querySelector('.bit-widget');
        if (completed || !widget || host.querySelector('.bit-widget-loading')) return;
        completed = true;
        clearTimeout(timeout);
        observer.disconnect();
        status.hidden = true;
        const hasEvents = Boolean(host.querySelector('.bit-event'));
        host.hidden = !hasEvents;
        fallback.hidden = hasEvents;
        host.dataset.ready = 'true';
        host.dataset.hasEvents = String(hasEvents);
      });
      observer.observe(host, { childList: true, subtree: true });
      timeout = setTimeout(failure, 20000);
      const script = document.createElement('script');
      script.src = 'https://widgetv3.bandsintown.com/main.min.js';
      script.async = true;
      script.charset = 'utf-8';
      script.addEventListener('error', () => failure(true), { once: true });
      document.head.append(script);
    }
    // Keep the third-party bundle out of the initial page load.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      }, { rootMargin: '400px' });
      observer.observe(document.getElementById('shows'));
    } else load();
  }, { once: true });
})();
