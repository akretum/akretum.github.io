document.documentElement.classList.remove('no-js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const supportsObserver = 'IntersectionObserver' in window;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const entryHasReachedViewport = (entry) => (
  entry.isIntersecting ||
  entry.boundingClientRect.top < (window.innerHeight || document.documentElement.clientHeight) * 1.1
);

const releaseTransientClass = (node, className, delay = 1400) => {
  window.setTimeout(() => node.classList.remove(className), delay);
};

const startApprovedHeroMotion = () => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.body.classList.add('is-ready'));
  });
};

if (document.fonts?.ready) {
  const fontGuard = new Promise((resolve) => window.setTimeout(resolve, 320));
  Promise.race([document.fonts.ready, fontGuard]).then(startApprovedHeroMotion, startApprovedHeroMotion);
} else {
  startApprovedHeroMotion();
}

const bindRafPointer = (element, update, leave) => {
  let frame = 0;
  let latestEvent = null;

  element.addEventListener('pointermove', (event) => {
    latestEvent = event;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (latestEvent) update(latestEvent);
    });
  }, { passive: true });

  element.addEventListener('pointerleave', () => {
    latestEvent = null;
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    leave?.();
  });
};

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

let headerFrame = 0;
let headerScrolled = null;

const updateHeader = () => {
  headerFrame = 0;
  const nextScrolled = window.scrollY > 28;
  if (nextScrolled === headerScrolled) return;
  headerScrolled = nextScrolled;
  header?.classList.toggle('scrolled', nextScrolled);
};

const requestHeaderUpdate = () => {
  if (headerFrame) return;
  headerFrame = window.requestAnimationFrame(updateHeader);
};

updateHeader();
window.addEventListener('scroll', requestHeaderUpdate, { passive: true });

const revealNodes = [...document.querySelectorAll('[data-reveal]')];

revealNodes.forEach((node) => {
  const delay = Number(node.dataset.delay || 0);
  node.style.setProperty('--reveal-delay', `${delay}ms`);
});

const revealNode = (node) => {
  if (node.classList.contains('is-visible')) return;
  node.classList.add('reveal-active');
  node.classList.add('is-visible');
  releaseTransientClass(node, 'reveal-active', 1300);
};

if (reducedMotion || !supportsObserver) {
  revealNodes.forEach(revealNode);
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entryHasReachedViewport(entry)) return;
        revealNode(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

const initializePassedEntranceFallback = () => {
  if (reducedMotion) return;

  const pendingEntranceNodes = new Set(
    document.querySelectorAll('[data-reveal], [data-motion], [data-micro-motion]')
  );
  let entranceFrame = 0;

  const activateEntranceNode = (node) => {
    if (node.matches('[data-reveal]')) revealNode(node);

    if (node.matches('[data-motion]') && !node.classList.contains('motion-visible')) {
      node.classList.add('motion-active');
      node.classList.add('motion-visible');
      releaseTransientClass(node, 'motion-active', 1500);
    }

    if (node.matches('[data-micro-motion]') && !node.classList.contains('micro-visible')) {
      node.classList.add('micro-active');
      node.classList.add('micro-visible');
      releaseTransientClass(node, 'micro-active', 1100);
    }
  };

  const flushPassedEntranceNodes = () => {
    entranceFrame = 0;
    const viewportThreshold = (window.innerHeight || document.documentElement.clientHeight) * 1.1;

    pendingEntranceNodes.forEach((node) => {
      if (node.getBoundingClientRect().top > viewportThreshold) return;
      activateEntranceNode(node);
      pendingEntranceNodes.delete(node);
    });

    if (!pendingEntranceNodes.size) {
      window.removeEventListener('scroll', requestPassedEntranceFlush);
      window.removeEventListener('resize', requestPassedEntranceFlush);
    }
  };

  const requestPassedEntranceFlush = () => {
    if (entranceFrame) return;
    entranceFrame = window.requestAnimationFrame(flushPassedEntranceNodes);
  };

  flushPassedEntranceNodes();
  if (pendingEntranceNodes.size) {
    window.addEventListener('scroll', requestPassedEntranceFlush, { passive: true });
    window.addEventListener('resize', requestPassedEntranceFlush, { passive: true });
  }
};

if (document.readyState === 'complete') {
  initializePassedEntranceFallback();
} else {
  document.addEventListener('DOMContentLoaded', initializePassedEntranceFallback, { once: true });
}

const sections = [...document.querySelectorAll('[data-section]')];
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

if (supportsObserver) {
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

let heroInRange = true;
const updateHeroWorkState = () => {
  hero?.classList.toggle('motion-paused', document.hidden || !heroInRange);
};

if (hero && supportsObserver && !reducedMotion) {
  const heroWorkObserver = new IntersectionObserver(
    ([entry]) => {
      heroInRange = Boolean(entry?.isIntersecting);
      updateHeroWorkState();
    },
    { threshold: 0, rootMargin: '25% 0px 25% 0px' }
  );
  heroWorkObserver.observe(hero);
  document.addEventListener('visibilitychange', updateHeroWorkState);
}

if (hero && parallaxTarget && finePointer && !reducedMotion) {
  bindRafPointer(
    hero,
    (event) => {
      const rect = hero.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp((event.clientY - rect.top) / rect.height);

      hero.style.setProperty('--pointer-x', `${x * 100}%`);
      hero.style.setProperty('--pointer-y', `${y * 100}%`);
      parallaxTarget.style.setProperty('--parallax-x', `${(x - 0.5) * 20}px`);
      parallaxTarget.style.setProperty('--parallax-y', `${(y - 0.5) * 16}px`);
    },
    () => {
      hero.style.setProperty('--pointer-x', '72%');
      hero.style.setProperty('--pointer-y', '44%');
      parallaxTarget.style.setProperty('--parallax-x', '0px');
      parallaxTarget.style.setProperty('--parallax-y', '0px');
    }
  );
}

const tiltCards = [...document.querySelectorAll('[data-tilt]')];

if (finePointer && !reducedMotion) {
  tiltCards.forEach((card) => {
    bindRafPointer(
      card,
      (event) => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        const rotateY = (x - 0.5) * 6;
        const rotateX = (0.5 - y) * 6;

        card.style.setProperty('--card-x', `${x * 100}%`);
        card.style.setProperty('--card-y', `${y * 100}%`);
        card.style.setProperty('--tilt-x', `${rotateX}deg`);
        card.style.setProperty('--tilt-y', `${rotateY}deg`);
      },
      () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--card-x', '50%');
        card.style.setProperty('--card-y', '50%');
      }
    );
  });
}

const flowSection = document.querySelector('[data-flow-section]');
const flowSteps = [...document.querySelectorAll('[data-flow-step]')];
let flowFrame = 0;
let flowInRange = reducedMotion || !supportsObserver;
let lastFlowProgress = '';

const updateFlow = () => {
  flowFrame = 0;
  if (!flowSection || !flowSteps.length || !flowInRange) return;

  const rect = flowSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const start = viewportHeight * 0.72;
  const distance = Math.max(rect.height - viewportHeight * 0.18, 1);
  const progress = reducedMotion ? 1 : clamp((start - rect.top) / distance);
  const progressValue = progress.toFixed(4);
  const currentIndex = Math.min(flowSteps.length - 1, Math.floor(progress * flowSteps.length));

  if (progressValue !== lastFlowProgress) {
    lastFlowProgress = progressValue;
    flowSection.style.setProperty('--flow-progress', progressValue);
  }

  flowSteps.forEach((step, index) => {
    let state = 'upcoming';
    if (index < currentIndex) state = 'complete';
    if (index === currentIndex) state = 'current';
    if (progress >= 0.995) state = 'complete';
    if (step.dataset.state !== state) step.dataset.state = state;
  });
};

const requestFlowUpdate = () => {
  if (!flowInRange || flowFrame) return;
  flowFrame = window.requestAnimationFrame(updateFlow);
};

if (flowSection && supportsObserver && !reducedMotion) {
  const flowWorkObserver = new IntersectionObserver(
    ([entry]) => {
      flowInRange = Boolean(entry?.isIntersecting);
      if (flowInRange) requestFlowUpdate();
    },
    { threshold: 0, rootMargin: '100% 0px 100% 0px' }
  );
  flowWorkObserver.observe(flowSection);
} else {
  updateFlow();
}

window.addEventListener('scroll', requestFlowUpdate, { passive: true });
window.addEventListener('resize', requestFlowUpdate, { passive: true });

const lightFields = [...document.querySelectorAll('[data-light-field]')];

if (finePointer && !reducedMotion) {
  lightFields.forEach((field) => {
    bindRafPointer(
      field,
      (event) => {
        const rect = field.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        field.style.setProperty('--light-x', `${x * 100}%`);
        field.style.setProperty('--light-y', `${y * 100}%`);
      },
      () => {
        field.style.setProperty('--light-x', '75%');
        field.style.setProperty('--light-y', '42%');
      }
    );
  });
}
