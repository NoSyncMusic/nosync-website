(() => {
  'use strict';

  const CLOSE_MS = 560;
  const HOLD_MS = 150;
  const REVEAL_MS = 720;
  const REVEAL_DELAY_MS = 180;
  const body = document.body;
  if (!body) return;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;
  let revealTimer = 0;

  function markReady() {
    window.clearTimeout(revealTimer);
    body.classList.add('is-page-transition-ready');
  }

  function resetCurtain() {
    navigating = false;
    window.clearTimeout(revealTimer);
    body.classList.add('is-page-wipe-reset', 'is-page-transition-ready');
    body.classList.remove('is-page-wiping');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      body.classList.remove('is-page-wipe-reset');
    }));
  }

  function beginReveal() {
    if (reducedMotion()) {
      markReady();
      return;
    }
    revealTimer = window.setTimeout(markReady, REVEAL_DELAY_MS + REVEAL_MS + 80);
  }

  function isSameDocument(url) {
    return url.origin === location.origin
      && url.pathname === location.pathname
      && url.search === location.search;
  }

  function eligibleLink(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    if (anchor.dataset.noPageTransition === 'true') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.target && anchor.target.toLowerCase() !== '_self') return false;
    if (anchor.closest('.stream-modal, [role="dialog"]')) return false;

    let url;
    try {
      url = new URL(anchor.href, document.baseURI);
    } catch {
      return false;
    }

    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.origin !== location.origin) return false;
    if (isSameDocument(url)) return false;
    return true;
  }

  function navigateWithCurtain(destination) {
    if (navigating) return;
    navigating = true;

    if (reducedMotion()) {
      window.location.assign(destination);
      return;
    }

    body.classList.add('is-page-wiping');
    window.setTimeout(() => {
      window.setTimeout(() => window.location.assign(destination), HOLD_MS);
    }, CLOSE_MS);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!eligibleLink(anchor)) return;

    event.preventDefault();
    navigateWithCurtain(anchor.href);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted || body.classList.contains('is-page-wiping')) {
      resetCurtain();
      return;
    }
    beginReveal();
  });

  if (document.readyState === 'complete') beginReveal();
  else window.addEventListener('load', beginReveal, { once: true });
})();
