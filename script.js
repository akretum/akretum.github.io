document.documentElement.classList.remove('no-js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

requestAnimationFrame(() => {
  document.body.classList.add('is-ready');
});

const menu = document.querySelector('[data-menu]');
const nav = document.querySelector('[data-nav]');
const header = document.querySelector('[data-header]');

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

const updateHeader = () => {
  header?.classList.toggle('scrolled', window.scrollY > 28);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealNodes = [...document.querySelectorAll('[data-reveal]')];

revealNodes.forEach((node) => {
  const delay = Number(node.dataset.delay || 0);
  node.style.setProperty('--reveal-delay', `${delay}ms`);
});

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

const sections = [...document.querySelectorAll('[data-section]')];
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-30% 0px -58% 0px', threshold: [0.05, 0.25, 0.55] }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const hero = document.querySelector('[data-hero]');
const parallaxTarget = document.querySelector('[data-parallax]');

if (hero && parallaxTarget && finePointer && !reducedMotion) {
  const updateHeroPointer = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);

    hero.style.setProperty('--pointer-x', `${x * 100}%`);
    hero.style.setProperty('--pointer-y', `${y * 100}%`);
    parallaxTarget.style.setProperty('--parallax-x', `${(x - 0.5) * 20}px`);
    parallaxTarget.style.setProperty('--parallax-y', `${(y - 0.5) * 16}px`);
  };

  hero.addEventListener('pointermove', updateHeroPointer);
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--pointer-x', '72%');
    hero.style.setProperty('--pointer-y', '44%');
    parallaxTarget.style.setProperty('--parallax-x', '0px');
    parallaxTarget.style.setProperty('--parallax-y', '0px');
  });
}

const tiltCards = [...document.querySelectorAll('[data-tilt]')];

if (finePointer && !reducedMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp((event.clientY - rect.top) / rect.height);
      const rotateY = (x - 0.5) * 6;
      const rotateX = (0.5 - y) * 6;

      card.style.setProperty('--card-x', `${x * 100}%`);
      card.style.setProperty('--card-y', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--card-x', '50%');
      card.style.setProperty('--card-y', '50%');
    });
  });
}

const flowSection = document.querySelector('[data-flow-section]');
const flowSteps = [...document.querySelectorAll('[data-flow-step]')];
let frameRequested = false;

const updateFlow = () => {
  frameRequested = false;
  if (!flowSection || !flowSteps.length) return;

  const rect = flowSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const start = viewportHeight * 0.72;
  const distance = Math.max(rect.height - viewportHeight * 0.18, 1);
  const progress = reducedMotion ? 1 : clamp((start - rect.top) / distance);
  const currentIndex = Math.min(flowSteps.length - 1, Math.floor(progress * flowSteps.length));

  flowSection.style.setProperty('--flow-progress', progress.toFixed(4));

  flowSteps.forEach((step, index) => {
    let state = 'upcoming';
    if (index < currentIndex) state = 'complete';
    if (index === currentIndex) state = 'current';
    if (progress >= 0.995) state = 'complete';
    step.dataset.state = state;
  });
};

const requestFlowUpdate = () => {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(updateFlow);
};

updateFlow();
window.addEventListener('scroll', requestFlowUpdate, { passive: true });
window.addEventListener('resize', requestFlowUpdate);

const lightFields = [...document.querySelectorAll('[data-light-field]')];

if (finePointer && !reducedMotion) {
  lightFields.forEach((field) => {
    field.addEventListener('pointermove', (event) => {
      const rect = field.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp((event.clientY - rect.top) / rect.height);
      field.style.setProperty('--light-x', `${x * 100}%`);
      field.style.setProperty('--light-y', `${y * 100}%`);
    });

    field.addEventListener('pointerleave', () => {
      field.style.setProperty('--light-x', '75%');
      field.style.setProperty('--light-y', '42%');
    });
  });
}
