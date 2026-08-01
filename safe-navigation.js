(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = document.querySelectorAll('.contact-actions .button-ghost[href="#portfolio"]');

  const scrollExactlyToSection = (target) => {
    const header = document.querySelector('[data-header]');
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const top = Math.max(0, targetTop - headerHeight);

    window.scrollTo({
      top,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById('portfolio');
      if (!target) return;

      event.preventDefault();
      scrollExactlyToSection(target);

      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      window.setTimeout(
        () => target.focus({ preventScroll: true }),
        reducedMotion ? 0 : 500
      );
    });
  });
})();
