(() => {
  'use strict';

  const HOLD_MS = 150;
  const CLOSE_FALLBACK_MS = 760;
  const REVEAL_FALLBACK_MS = 1100;
  const body = document.body;
  if (!body) return;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;
  let revealTimer = 0;

  function markReady() {
    window.clearTimeout(revealTimer);
    const wasReady = body.classList.contains('is-page-transition-ready');
    body.classList.add('is-page-transition-ready');
    if (!wasReady) window.dispatchEvent(new CustomEvent('nosync:page-transition-ready'));
  }

  function resetCurtain() {
    navigating = false;
    window.clearTimeout(revealTimer);
    body.classList.add('is-page-wipe-reset');
    body.classList.remove('is-page-wiping');
    markReady();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      body.classList.remove('is-page-wipe-reset');
    }));
  }

  function beginReveal() {
    if (body.classList.contains('is-page-transition-ready')) return;
    if (reducedMotion()) {
      markReady();
      return;
    }

    let finished = false;
    const complete = () => {
      if (finished) return;
      finished = true;
      body.removeEventListener('animationend', onAnimationEnd);
      markReady();
    };
    const onAnimationEnd = (event) => {
      if (event.target !== body) return;
      if (event.animationName !== 'page-curtain-reveal') return;
      if (event.pseudoElement && event.pseudoElement !== '::before') return;
      complete();
    };

    body.addEventListener('animationend', onAnimationEnd);
    revealTimer = window.setTimeout(complete, REVEAL_FALLBACK_MS);
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

    let covered = false;
    let fallbackTimer = 0;
    const navigate = () => {
      if (covered) return;
      covered = true;
      window.clearTimeout(fallbackTimer);
      body.removeEventListener('transitionend', onTransitionEnd);
      window.setTimeout(() => window.location.assign(destination), HOLD_MS);
    };
    const onTransitionEnd = (event) => {
      if (event.target !== body) return;
      if (event.propertyName !== 'transform') return;
      if (event.pseudoElement && event.pseudoElement !== '::before') return;
      navigate();
    };

    body.addEventListener('transitionend', onTransitionEnd);
    body.classList.add('is-page-wiping');
    fallbackTimer = window.setTimeout(navigate, CLOSE_FALLBACK_MS);
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


/* No Sync first-party analytics */
(() => {
  if (document.querySelector('script[data-nosync-analytics]')) return;
  const script = document.createElement('script');
  script.src = 'https://portal.nosyncmusic.com/analytics.js';
  script.defer = true;
  script.dataset.nosyncAnalytics = 'true';
  document.head.appendChild(script);
})();

/* analytics rollout marker */

/* analytics cache rollout marker */

/* analytics verification retry marker */
