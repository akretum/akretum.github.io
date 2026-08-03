(() => {
  const menu = document.querySelector('[data-menu]');
  const nav = document.querySelector('[data-nav]');

  const closeMenu = () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('open');
  };

  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('open', !open);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!nav?.classList.contains('open')) return;
    if (nav.contains(event.target) || menu?.contains(event.target)) return;
    closeMenu();
  });

  document.querySelectorAll('[data-year]').forEach((node) => {
    const foundedYear = Number(node.dataset.foundedYear || 2026);
    const currentYear = new Date().getFullYear();
    const safeCurrentYear = Math.max(foundedYear, currentYear);
    node.textContent = safeCurrentYear === foundedYear
      ? String(foundedYear)
      : `${foundedYear}–${safeCurrentYear}`;
  });

  document.querySelectorAll('.contact-actions .button, .product-card__footer a').forEach((element) => {
    element.addEventListener('focus', () => {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  });
})();
