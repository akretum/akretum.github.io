(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;
  const entryHasReachedViewport = (entry) => (
    entry.isIntersecting ||
    entry.boundingClientRect.top < (window.innerHeight || document.documentElement.clientHeight) * 1.1
  );

  document.body.dataset.motionSystem = 'disc23';
  document.body.dataset.motionRuntime = 'disc37-performance-v16';

  const groups = [
    { selector: '.site-header .brand, .site-header .menu-button, .site-header .site-nav', variant: 'soft', step: 70 },
    { selector: '.story__heading, .story__content > p, .story-principles > div', variant: 'up', step: 90 },
    { selector: '.section-heading > div, .section-heading > h2', variant: 'up', step: 110 },
    { selector: '.capability-card', variant: 'scale', step: 95 },
    { selector: '.systems__intro > div', variant: 'up', step: 110 },
    { selector: '.flow-step', variant: 'up', step: 85 },
    { selector: '.portfolio__heading > div, .portfolio__heading > p', variant: 'up', step: 110 },
    { selector: '.product-card', variant: 'scale', step: 110 },
    { selector: '.contact-panel__content > *, .contact-panel__email', variant: 'up', step: 85 },
    { selector: '.footer__brand, .footer__nav, .footer__bottom > *', variant: 'soft', step: 80 }
  ];

  const motionNodes = new Set();

  groups.forEach(({ selector, variant, step }) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (!node.dataset.motion) node.dataset.motion = variant;
      node.style.setProperty('--motion-delay', `${Math.min(index, 6) * step}ms`);
      motionNodes.add(node);
    });
  });

  // Keep the accepted Hero entrance system; only register its child elements for validation.
  document.querySelectorAll('.hero-enter').forEach((node) => {
    node.dataset.motionRegistered = 'hero';
  });

  const releaseLayer = (node, className, delay) => {
    window.setTimeout(() => node.classList.remove(className), delay);
  };

  const show = (node) => {
    if (node.classList.contains('motion-visible')) return;

    node.classList.add('motion-active');
    if (node.matches('[data-reveal]')) {
      node.classList.add('reveal-active');
      node.classList.add('is-visible');
      releaseLayer(node, 'reveal-active', 1300);
    }
    node.classList.add('motion-visible');
    window.setTimeout(() => node.classList.remove('motion-active'), 1500);
  };

  if (reduceMotion || !supportsObserver) {
    motionNodes.forEach(show);
    root.dataset.motionPreference = reduceMotion ? 'reduced' : 'fallback';
    return;
  }

  root.dataset.motionPreference = 'full';

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entryHasReachedViewport(entry)) return;
        show(entry.target);
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -7% 0px'
    }
  );

  motionNodes.forEach((node) => observer.observe(node));

  // Product and capability cards retain their accepted light response, with
  // pointer reads and writes coalesced to one compositor update per frame.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  document.querySelectorAll('.product-card, .capability-card').forEach((card) => {
    let frame = 0;
    let latestEvent = null;

    card.addEventListener('pointermove', (event) => {
      latestEvent = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!latestEvent) return;
        const rect = card.getBoundingClientRect();
        const x = ((latestEvent.clientX - rect.left) / rect.width) * 100;
        const y = ((latestEvent.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--motion-x', `${x.toFixed(2)}%`);
        card.style.setProperty('--motion-y', `${y.toFixed(2)}%`);
      });
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      latestEvent = null;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      card.style.setProperty('--motion-x', '50%');
      card.style.setProperty('--motion-y', '50%');
    });
  });
})();
