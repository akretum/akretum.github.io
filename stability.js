(() => {
  const root = document.documentElement;
  const hero = document.querySelector('[data-hero]');
  const scrollCue = document.querySelector('[data-scroll-cue], .scroll-cue');
  let frame = 0;

  root.dataset.productionStability = 'disc15';

  const updateScrollCue = () => {
    frame = 0;
    if (!hero || !scrollCue) return;

    const heroHeight = Math.max(hero.offsetHeight, 1);
    const shouldHide = window.innerWidth <= 1100 || window.scrollY > Math.max(72, heroHeight * 0.18);
    scrollCue.classList.toggle('is-hidden', shouldHide);
    scrollCue.setAttribute('aria-hidden', String(shouldHide));
  };

  const scheduleScrollCueUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateScrollCue);
  };

  updateScrollCue();
  window.addEventListener('scroll', scheduleScrollCueUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollCueUpdate, { passive: true });

  document.querySelectorAll('.contact-actions .button, .product-card__footer a').forEach((element) => {
    element.addEventListener('focus', () => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  });
})();
