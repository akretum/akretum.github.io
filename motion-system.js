(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
  const supportsObserver = 'IntersectionObserver' in window;
  const reducedMotion = reducedMotionQuery.matches;
  const finePointer = finePointerQuery.matches && !reducedMotion;
  const rtl = root.dir === 'rtl';

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const lerp = (current, target, amount) => current + (target - current) * amount;
  const closeEnough = (current, target, epsilon = 0.02) => Math.abs(current - target) <= epsilon;
  const setPropertyIfChanged = (element, property, value, cache) => {
    if (!element || cache.get(property) === value) return;
    cache.set(property, value);
    element.style.setProperty(property, value);
  };

  const runtime = {
    frame: 0,
    continuation: false,
    scrollY: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight,
    scrollModules: new Set(),
    frameModules: new Set(),
    rangeState: new Map(),
    hidden: document.hidden
  };

  const scheduleFrame = () => {
    if (runtime.frame) return;
    runtime.frame = window.requestAnimationFrame(runFrame);
  };

  const runFrame = () => {
    runtime.frame = 0;
    runtime.continuation = false;
    runtime.scrollY = window.scrollY;
    runtime.width = window.innerWidth;
    runtime.height = window.innerHeight;

    runtime.scrollModules.forEach((update) => update(runtime));
    runtime.frameModules.forEach((update) => {
      if (update(runtime)) runtime.continuation = true;
    });

    if (runtime.continuation) scheduleFrame();
  };

  const addScrollModule = (update) => runtime.scrollModules.add(update);
  const addFrameModule = (update) => runtime.frameModules.add(update);

  const releaseClass = (element, className, delay = 900) => {
    window.setTimeout(() => element.classList.remove(className), delay);
  };

  const revealElement = (element) => {
    if (element.classList.contains('motion-visible')) return;
    element.classList.add('motion-active', 'motion-visible');
    if (element.matches('[data-reveal]')) element.classList.add('is-visible');
    releaseClass(element, 'motion-active', 900);
  };

  const prepareEntranceSystem = () => {
    const groups = [
      { selector: '.story__heading, .story__content > p', variant: 'up', step: 70 },
      { selector: '.story-principles > div', variant: 'scale', step: 80 },
      { selector: '.section-heading > div, .section-heading > h2', variant: 'up', step: 80 },
      { selector: '.capability-card', variant: 'scale', step: 85 },
      { selector: '.systems__intro > div', variant: 'up', step: 80 },
      { selector: '.flow-step', variant: 'up', step: 75 },
      { selector: '.portfolio__heading > div, .portfolio__heading > p', variant: 'up', step: 80 },
      { selector: '.product-card', variant: 'scale', step: 90 },
      { selector: '.contact-panel__content > *, .contact-panel__email', variant: 'up', step: 70 },
      { selector: '.footer__brand, .footer__nav, .footer__bottom > *', variant: 'soft', step: 65 }
    ];

    const nodes = new Set(document.querySelectorAll('[data-reveal]'));

    groups.forEach(({ selector, variant, step }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        if (element.closest('.hero')) return;
        element.dataset.motion = element.dataset.motion || variant;
        element.style.setProperty('--motion-delay', `${Math.min(index, 4) * step}ms`);
        nodes.add(element);
      });
    });

    if (reducedMotion || !supportsObserver) {
      nodes.forEach(revealElement);
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top > runtime.height * 1.04) return;
        revealElement(entry.target);
        currentObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -4% 0px'
    });

    nodes.forEach((element) => observer.observe(element));

    const revealPassedNodes = () => {
      nodes.forEach((element) => {
        if (element.classList.contains('motion-visible')) return;
        if (element.getBoundingClientRect().top <= runtime.height * 1.04) {
          revealElement(element);
          observer.unobserve(element);
        }
      });
    };
    addScrollModule(revealPassedNodes);
  };

  const prepareSectionRanges = () => {
    if (!supportsObserver) {
      document.querySelectorAll('[data-hero], .story, .systems, .portfolio, .contact, .footer')
        .forEach((element) => runtime.rangeState.set(element, true));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        runtime.rangeState.set(entry.target, entry.isIntersecting);
        entry.target.classList.toggle('motion-in-range', entry.isIntersecting);
        if (entry.target.matches('[data-hero], .contact')) {
          entry.target.classList.toggle('motion-paused', document.hidden || !entry.isIntersecting);
        }
      });
      scheduleFrame();
    }, {
      threshold: 0,
      rootMargin: '35% 0px 35% 0px'
    });

    document.querySelectorAll('[data-hero], .story, .systems, .portfolio, .contact, .footer')
      .forEach((element) => observer.observe(element));
  };

  const initHeaderMotion = () => {
    const header = document.querySelector('[data-header]');
    const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const sections = [...document.querySelectorAll('[data-section]')];
    let lastScrolled = null;

    document.querySelectorAll('.site-nav a').forEach((link, index) => {
      link.style.setProperty('--nav-index', String(index));
    });

    addScrollModule(({ scrollY }) => {
      const scrolled = scrollY > 28;
      if (scrolled === lastScrolled) return;
      lastScrolled = scrolled;
      header?.classList.toggle('scrolled', scrolled);
    });

    if (supportsObserver) {
      const sectionObserver = new IntersectionObserver((entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;

        navLinks.forEach((link) => {
          const current = link.getAttribute('href') === `#${active.target.id}`;
          if (current) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }, {
        rootMargin: '-28% 0px -60% 0px',
        threshold: [0.05, 0.25, 0.55]
      });
      sections.forEach((section) => sectionObserver.observe(section));
    }
  };

  const startHeroEntrance = () => {
    const activate = () => window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => body.classList.add('is-ready'));
    });

    if (document.fonts?.ready) {
      const guard = new Promise((resolve) => window.setTimeout(resolve, 280));
      Promise.race([document.fonts.ready, guard]).then(activate, activate);
    } else {
      activate();
    }
  };

  const bindPointerSurface = (element, handlers) => {
    let pendingEvent = null;
    let pointerFrame = 0;

    const flush = () => {
      pointerFrame = 0;
      if (pendingEvent) handlers.move?.(pendingEvent);
    };

    element.addEventListener('pointerenter', (event) => {
      element.classList.add('motion-interacting');
      handlers.enter?.(event);
    }, { passive: true });

    element.addEventListener('pointermove', (event) => {
      pendingEvent = event;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(flush);
    }, { passive: true });

    element.addEventListener('pointerleave', () => {
      pendingEvent = null;
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      }
      element.classList.remove('motion-interacting');
      handlers.leave?.();
    }, { passive: true });
  };

  const initHeroMotion = () => {
    const hero = document.querySelector('[data-hero]');
    const visual = document.querySelector('.hero-visual');
    const mark = document.querySelector('.hero-mark');
    const field = document.querySelector('.hero-visual__field');
    const caption = document.querySelector('.hero-visual__caption');
    const orbits = [...document.querySelectorAll('.hero-orbit')];
    if (!hero || !visual || !mark) return;

    const cache = new Map();
    const target = { x: 0, y: 0, rx: 0, ry: 0 };
    const current = { x: 0, y: 0, rx: 0, ry: 0 };

    const reset = () => {
      target.x = 0;
      target.y = 0;
      target.rx = 0;
      target.ry = 0;
      scheduleFrame();
    };

    if (finePointer) {
      bindPointerSurface(hero, {
        move: (event) => {
          const rect = hero.getBoundingClientRect();
          const x = clamp((event.clientX - rect.left) / rect.width);
          const y = clamp((event.clientY - rect.top) / rect.height);
          target.x = (x - 0.5) * 24;
          target.y = (y - 0.5) * 20;
          target.rx = (0.5 - y) * 6;
          target.ry = (x - 0.5) * 6;
          hero.style.setProperty('--hero-aurora-x', `${(x * 100).toFixed(2)}%`);
          hero.style.setProperty('--hero-aurora-y', `${(y * 100).toFixed(2)}%`);
          scheduleFrame();
        },
        leave: reset
      });
    }

    addFrameModule(() => {
      if (reducedMotion || !runtime.rangeState.get(hero)) return false;

      current.x = lerp(current.x, target.x, 0.14);
      current.y = lerp(current.y, target.y, 0.14);
      current.rx = lerp(current.rx, target.rx, 0.12);
      current.ry = lerp(current.ry, target.ry, 0.12);

      setPropertyIfChanged(visual, '--hero-depth-x', `${current.x.toFixed(2)}px`, cache);
      setPropertyIfChanged(visual, '--hero-depth-y', `${current.y.toFixed(2)}px`, cache);
      setPropertyIfChanged(mark, '--hero-tilt-x', `${current.rx.toFixed(2)}deg`, cache);
      setPropertyIfChanged(mark, '--hero-tilt-y', `${current.ry.toFixed(2)}deg`, cache);
      setPropertyIfChanged(field, '--hero-field-x', `${(current.x * 0.7).toFixed(2)}px`, cache);
      setPropertyIfChanged(field, '--hero-field-y', `${(current.y * 0.7).toFixed(2)}px`, cache);
      orbits.forEach((orbit, index) => {
        orbit.style.setProperty('--hero-orbit-x', `${(current.x * (index ? 0.18 : 0.26)).toFixed(2)}px`);
        orbit.style.setProperty('--hero-orbit-y', `${(current.y * (index ? 0.18 : 0.26)).toFixed(2)}px`);
      });
      caption?.style.setProperty('--hero-caption-x', `${(current.x * 0.35).toFixed(2)}px`);
      caption?.style.setProperty('--hero-caption-y', `${(current.y * 0.35).toFixed(2)}px`);

      return !(
        closeEnough(current.x, target.x) &&
        closeEnough(current.y, target.y) &&
        closeEnough(current.rx, target.rx) &&
        closeEnough(current.ry, target.ry)
      );
    });

    if (!finePointer && !reducedMotion) {
      addScrollModule(({ height }) => {
        if (!runtime.rangeState.get(hero)) return;
        const rect = hero.getBoundingClientRect();
        const progress = clamp((0 - rect.top) / Math.max(rect.height - height, 1));
        field?.style.setProperty('--hero-mobile-depth', `${(progress * 6).toFixed(2)}px`);
      });
    }
  };

  const initCompanyMotion = () => {
    const story = document.querySelector('.story');
    const principles = [...document.querySelectorAll('.story-principles > div')];
    const principlesContainer = document.querySelector('.story-principles');
    if (!story || !principlesContainer || !principles.length) return;

    const field = document.createElement('div');
    field.className = 'story-accumulation';
    field.setAttribute('aria-hidden', 'true');

    const seeds = [
      [-120, -70], [-76, 42], [-30, -112], [18, 88], [65, -82],
      [108, 20], [132, 76], [-136, 105], [82, 118]
    ];
    const dots = seeds.map(([x, y], index) => {
      const dot = document.createElement('span');
      dot.dataset.startX = String(x);
      dot.dataset.startY = String(y);
      dot.dataset.endX = String((index % 3 - 1) * 12);
      dot.dataset.endY = String((Math.floor(index / 3) - 1) * 12);
      field.append(dot);
      return dot;
    });
    story.prepend(field);

    let lastProgress = -1;
    addScrollModule(({ height }) => {
      if (!runtime.rangeState.get(story)) return;
      const rect = story.getBoundingClientRect();
      const progress = clamp((height * 0.78 - rect.top) / Math.max(rect.height + height * 0.2, 1));
      if (Math.abs(progress - lastProgress) < 0.003) return;
      lastProgress = progress;
      story.style.setProperty('--story-progress', progress.toFixed(4));
      story.style.setProperty('--story-ring-scale', (0.72 + progress * 0.28).toFixed(4));
      story.style.setProperty('--story-ring-opacity', (0.08 + progress * 0.16).toFixed(4));

      dots.forEach((dot, index) => {
        const startX = Number(dot.dataset.startX);
        const startY = Number(dot.dataset.startY);
        const endX = Number(dot.dataset.endX);
        const endY = Number(dot.dataset.endY);
        const local = clamp((progress - index * 0.035) / 0.72);
        const x = lerp(startX, endX, local);
        const y = lerp(startY, endY, local);
        dot.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(0.72 + local * 0.28).toFixed(3)})`;
        dot.style.opacity = String(0.12 + local * 0.34);
      });

      principles.forEach((principle, index) => {
        const active = progress >= index / principles.length - 0.02;
        principle.dataset.state = active ? 'active' : 'pending';
      });
    });

    principles.forEach((principle) => {
      principle.addEventListener('focusin', () => principle.dataset.focused = 'true');
      principle.addEventListener('focusout', () => delete principle.dataset.focused);
    });
  };

  const bindDepthCard = (card, options) => {
    if (!finePointer) return;
    const maxTilt = options.maxTilt;
    bindPointerSurface(card, {
      move: (event) => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        card.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
        card.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
        card.style.setProperty('--tilt-x', `${((0.5 - y) * maxTilt * 2).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${((x - 0.5) * maxTilt * 2).toFixed(2)}deg`);
      },
      leave: () => {
        card.style.setProperty('--pointer-x', '50%');
        card.style.setProperty('--pointer-y', '50%');
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      }
    });
  };

  const initCapabilitiesMotion = () => {
    document.querySelectorAll('.capability-card').forEach((card) => {
      bindDepthCard(card, { maxTilt: 3.5 });
    });
  };

  const initProcessMotion = () => {
    const section = document.querySelector('[data-flow-section]');
    const steps = [...document.querySelectorAll('[data-flow-step]')];
    if (!section || !steps.length) return;

    let lastProgress = '';
    let lastCurrent = -1;

    addScrollModule(({ height, width }) => {
      if (!runtime.rangeState.get(section)) return;

      const rect = section.getBoundingClientRect();
      let progress;
      let currentIndex;

      if (width <= 700) {
        const centers = steps.map((step) => {
          const stepRect = step.getBoundingClientRect();
          return stepRect.top + stepRect.height / 2;
        });
        const viewportCenter = height * 0.52;
        currentIndex = centers.reduce((best, center, index) => (
          Math.abs(center - viewportCenter) < Math.abs(centers[best] - viewportCenter) ? index : best
        ), 0);
        const first = centers[0];
        const last = centers.at(-1);
        progress = clamp((viewportCenter - first) / Math.max(last - first, 1));
      } else {
        progress = clamp((height * 0.72 - rect.top) / Math.max(rect.height - height * 0.18, 1));
        currentIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      }

      const progressValue = progress.toFixed(4);
      if (progressValue !== lastProgress) {
        lastProgress = progressValue;
        section.style.setProperty('--flow-progress', progressValue);
      }

      if (currentIndex !== lastCurrent || progress >= 0.995) {
        lastCurrent = currentIndex;
        steps.forEach((step, index) => {
          let state = 'upcoming';
          if (index < currentIndex) state = 'complete';
          if (index === currentIndex) state = 'current';
          if (progress >= 0.995) state = 'complete';
          if (step.dataset.state !== state) step.dataset.state = state;
        });
      }
    });
  };

  const initPortfolioMotion = () => {
    const portfolio = document.querySelector('.portfolio');
    if (!portfolio) return;

    addScrollModule(({ height }) => {
      if (!runtime.rangeState.get(portfolio) || reducedMotion) return;
      const rect = portfolio.getBoundingClientRect();
      const progress = clamp((height - rect.top) / Math.max(height + rect.height, 1));
      const direction = rtl ? 1 : -1;
      const shift = (progress - 0.5) * 48 * direction;
      portfolio.style.setProperty('--portfolio-shift', `${shift.toFixed(2)}px`);
      portfolio.style.setProperty('--portfolio-mask', `${((1 - progress) * 22).toFixed(2)}%`);
    });

    document.querySelectorAll('.product-card').forEach((card) => {
      bindDepthCard(card, { maxTilt: 2 });
    });
  };

  const bindMagneticButton = (button) => {
    if (!finePointer) return;
    bindPointerSurface(button, {
      move: (event) => {
        const rect = button.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        button.style.setProperty('--magnetic-x', `${((x - 0.5) * 8).toFixed(2)}px`);
        button.style.setProperty('--magnetic-y', `${((y - 0.5) * 8).toFixed(2)}px`);
      },
      leave: () => {
        button.style.setProperty('--magnetic-x', '0px');
        button.style.setProperty('--magnetic-y', '0px');
      }
    });
  };

  const initContactMotion = () => {
    const contact = document.querySelector('.contact');
    const panel = document.querySelector('.contact-panel');
    if (!contact || !panel) return;

    const target = { x: 72, y: 42, cornerX: 0, cornerY: 0 };
    const current = { x: 72, y: 42, cornerX: 0, cornerY: 0 };
    const cache = new Map();

    if (finePointer) {
      bindPointerSurface(panel, {
        move: (event) => {
          const rect = panel.getBoundingClientRect();
          const x = clamp((event.clientX - rect.left) / rect.width);
          const y = clamp((event.clientY - rect.top) / rect.height);
          target.x = x * 100;
          target.y = y * 100;
          target.cornerX = (x - 0.5) * 8;
          target.cornerY = (y - 0.5) * 8;
          scheduleFrame();
        },
        leave: () => {
          target.x = 72;
          target.y = 42;
          target.cornerX = 0;
          target.cornerY = 0;
          scheduleFrame();
        }
      });
    }

    addFrameModule(() => {
      if (reducedMotion || !runtime.rangeState.get(contact)) return false;
      current.x = lerp(current.x, target.x, 0.09);
      current.y = lerp(current.y, target.y, 0.09);
      current.cornerX = lerp(current.cornerX, target.cornerX, 0.11);
      current.cornerY = lerp(current.cornerY, target.cornerY, 0.11);

      setPropertyIfChanged(panel, '--contact-x', `${current.x.toFixed(2)}%`, cache);
      setPropertyIfChanged(panel, '--contact-y', `${current.y.toFixed(2)}%`, cache);
      setPropertyIfChanged(panel, '--contact-corner-x', `${current.cornerX.toFixed(2)}px`, cache);
      setPropertyIfChanged(panel, '--contact-corner-y', `${current.cornerY.toFixed(2)}px`, cache);

      return !(
        closeEnough(current.x, target.x, 0.05) &&
        closeEnough(current.y, target.y, 0.05) &&
        closeEnough(current.cornerX, target.cornerX) &&
        closeEnough(current.cornerY, target.cornerY)
      );
    });

    document.querySelectorAll('.hero-actions .button, .contact-actions .button')
      .forEach(bindMagneticButton);
  };

  const initFooterMotion = () => {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    if (reducedMotion || !supportsObserver) {
      footer.classList.add('is-settled');
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      footer.classList.add('is-settled');
      observer.disconnect();
    }, { threshold: 0.18 });
    observer.observe(footer);
  };

  const initialize = () => {
    body.dataset.premiumMotion = 'disc37-premium-motion-v18-20260803';
    root.dataset.motionController = 'single-owner-v18';
    root.dataset.motionPreference = reducedMotion ? 'reduced' : 'full';
    root.dataset.pointerMode = finePointer ? 'fine' : coarsePointerQuery.matches ? 'coarse' : 'none';

    prepareSectionRanges();
    prepareEntranceSystem();
    initHeaderMotion();
    initHeroMotion();
    initCompanyMotion();
    initCapabilitiesMotion();
    initProcessMotion();
    initPortfolioMotion();
    initContactMotion();
    initFooterMotion();

    document.addEventListener('visibilitychange', () => {
      runtime.hidden = document.hidden;
      const hero = document.querySelector('[data-hero]');
      const contact = document.querySelector('.contact');
      hero?.classList.toggle('motion-paused', document.hidden || !runtime.rangeState.get(hero));
      contact?.classList.toggle('motion-paused', document.hidden || !runtime.rangeState.get(contact));
      scheduleFrame();
    });

    window.addEventListener('scroll', scheduleFrame, { passive: true });
    window.addEventListener('resize', () => {
      runtime.width = window.innerWidth;
      runtime.height = window.innerHeight;
      scheduleFrame();
    }, { passive: true });

    root.classList.remove('no-js');

    if (reducedMotion) {
      document.querySelectorAll('[data-reveal], [data-motion]').forEach(revealElement);
      body.classList.add('is-ready');
    } else {
      startHeroEntrance();
    }

    scheduleFrame();
  };

  try {
    initialize();
  } catch {
    root.classList.add('motion-fallback');
    body.dataset.premiumMotion = 'fallback';
  }
})();
