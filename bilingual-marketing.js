(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;
  document.body.dataset.marketingExperience = 'disc26';

  const groups = [
    { selector: '.hero-proof span, .hero-visual__caption span', variant: 'soft', step: 65 },
    { selector: '.story__heading .eyebrow, .story__heading h2', variant: 'left', step: 95 },
    { selector: '.story__content > p, .story-principles > div', variant: 'up', step: 85 },
    { selector: '.section-heading .eyebrow, .section-heading .section-index, .section-heading h2', variant: 'up', step: 90 },
    { selector: '.capability-card__top, .capability-card h3, .capability-card p, .capability-tags, .capability-card__arrow', variant: 'soft', step: 55 },
    { selector: '.systems__intro .eyebrow, .systems__intro .section-index, .systems__intro h2, .systems__lead', variant: 'up', step: 80 },
    { selector: '.flow-step__number, .flow-step strong, .flow-step p', variant: 'soft', step: 50 },
    { selector: '.portfolio__heading .eyebrow, .portfolio__heading h2, .portfolio__heading > p', variant: 'up', step: 90 },
    { selector: '.product-card__meta, .product-card h3, .product-card > p, .product-card__footer', variant: 'soft', step: 60 },
    { selector: '.contact-panel .eyebrow, .contact-panel h2, .contact-panel__content > p, .contact-actions, .contact-panel__email', variant: 'up', step: 75 },
    { selector: '.footer__brand, .footer__nav a, .footer__bottom p:not(:last-child)', variant: 'soft', step: 60 },
    { selector: '.language-switch', variant: 'scale', step: 0 }
  ];

  const nodes = [];
  groups.forEach(({ selector, variant, step }) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (node.closest('.hero') && !node.matches('.hero-proof span, .hero-visual__caption span')) return;
      node.dataset.microMotion = variant;
      node.style.setProperty('--micro-delay', `${Math.min(index, 7) * step}ms`);
      nodes.push(node);
    });
  });

  document.querySelectorAll('.footer__bottom p:last-child').forEach((copyright) => {
    delete copyright.dataset.microMotion;
    copyright.style.removeProperty('--micro-delay');
    copyright.classList.add('micro-visible');
    copyright.dataset.identityVisible = 'true';
  });

  const reveal = (node) => node.classList.add('micro-visible');
  if (reduceMotion || !supportsObserver) {
    nodes.forEach(reveal);
    document.documentElement.dataset.expandedMotion = reduceMotion ? 'reduced' : 'fallback';
    return;
  }

  document.documentElement.dataset.expandedMotion = 'full';
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
  );
  nodes.forEach((node) => observer.observe(node));

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  document.querySelectorAll('.story-principles > div, .flow-step, .product-card, .capability-card, .contact-panel').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--marketing-x', `${x.toFixed(2)}%`);
      element.style.setProperty('--marketing-y', `${y.toFixed(2)}%`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--marketing-x', '50%');
      element.style.setProperty('--marketing-y', '50%');
    });
  });
})();
