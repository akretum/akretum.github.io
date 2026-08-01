(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;

  document.body.dataset.motionSystem = 'disc23';

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

  const motionNodes = [];

  groups.forEach(({ selector, variant, step }) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (!node.dataset.motion) node.dataset.motion = variant;
      node.style.setProperty('--motion-delay', `${Math.min(index, 6) * step}ms`);
      motionNodes.push(node);
    });
  });

  // Keep the accepted Hero entrance system; only register its child elements for validation.
  document.querySelectorAll('.hero-enter').forEach((node) => {
    node.dataset.motionRegistered = 'hero';
  });

  const show = (node) => node.classList.add('motion-visible');

  if (reduceMotion || !supportsObserver) {
    motionNodes.forEach(show);
    root.dataset.motionPreference = reduceMotion ? 'reduced' : 'fallback';
    return;
  }

  root.dataset.motionPreference = 'full';

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
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

  // Product and capability cards receive a local pointer coordinate for future-safe light response.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  document.querySelectorAll('.product-card, .capability-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--motion-x', `${x.toFixed(2)}%`);
      card.style.setProperty('--motion-y', `${y.toFixed(2)}%`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--motion-x', '50%');
      card.style.setProperty('--motion-y', '50%');
    });
  });
})();
