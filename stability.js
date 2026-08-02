(() => {
  const root = document.documentElement;
  const hero = document.querySelector('[data-hero]');
  const scrollCue = document.querySelector('[data-scroll-cue], .scroll-cue');
  let frame = 0;
  let heroHideThreshold = 72;
  let lastHidden = null;

  root.dataset.productionStability = 'disc15';
  root.dataset.scrollPerformance = 'disc37-v16';

  const measureHero = () => {
    if (!hero) return;
    heroHideThreshold = Math.max(72, hero.getBoundingClientRect().height * 0.18);
  };

  const updateScrollCue = () => {
    frame = 0;
    if (!hero || !scrollCue) return;

    const shouldHide = window.innerWidth <= 1100 || window.scrollY > heroHideThreshold;
    if (shouldHide === lastHidden) return;
    lastHidden = shouldHide;
    scrollCue.classList.toggle('is-hidden', shouldHide);
    scrollCue.setAttribute('aria-hidden', String(shouldHide));
  };

  const scheduleScrollCueUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateScrollCue);
  };

  const measureAndSchedule = () => {
    measureHero();
    scheduleScrollCueUpdate();
  };

  measureAndSchedule();
  window.addEventListener('scroll', scheduleScrollCueUpdate, { passive: true });
  window.addEventListener('resize', measureAndSchedule, { passive: true });

  if ('ResizeObserver' in window && hero) {
    const resizeObserver = new ResizeObserver(measureAndSchedule);
    resizeObserver.observe(hero);
  }

  document.querySelectorAll('.contact-actions .button, .product-card__footer a').forEach((element) => {
    element.addEventListener('focus', () => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  });
})();
