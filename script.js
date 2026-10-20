/* ═══════════════════════════════════════════════════════════════
   TENNERI — Dual Theme Engine
   GSAP + ScrollTrigger + cinematic theme switch
═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─── UTILITIES ─── */
const $  = id  => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const lerp = (a, b, n) => (1 - n) * a + n * b;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function splitWords(el) {
  if (!el) return [];
  const words = el.textContent.split(/(\s+)/);
  el.innerHTML = words.map(w =>
    w.trim() === ''
      ? w
      : `<span class="word" style="display:inline-block;overflow:hidden"><span class="word-inner" style="display:inline-block">${w}</span></span>`
  ).join('');
  return el.querySelectorAll('.word-inner');
}

function splitChars(el) {
  if (!el) return [];
  const chars = el.textContent.split('');
  el.innerHTML = chars.map(c =>
    c === ' '
      ? '<span class="char char--space">&nbsp;</span>'
      : `<span class="char">${c}</span>`
  ).join('');
  return el.querySelectorAll('.char');
}

/* ─── THEME SYSTEM ─── */
const THEME_KEY = 'tenneri-theme';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme, animate = true) {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  if (current === theme) return;

  if (!animate) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateCursorVisibility(theme);
    return;
  }

  // Clip-path circle wipe from toggle position
  const wipe = $('theme-wipe');
  const toggle = $('theme-toggle-fixed');
  let x = 95, y = 95; // default: bottom-right area
  if (toggle) {
    const rect = toggle.getBoundingClientRect();
    x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
  }

  // 1. Position wipe at origin, gold
  gsap.set(wipe, {
    opacity: 1,
    background: '#d4a843',
    clipPath: `circle(0% at ${x}% ${y}%)`,
    pointerEvents: 'all'
  });

  // 2. Expand to cover screen
  gsap.to(wipe, {
    clipPath: `circle(200vmax at ${x}% ${y}%)`,
    duration: 0.38,
    ease: 'power2.in',
    onComplete: () => {
      // 3. Switch theme while covered
      html.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
      updateCursorVisibility(theme);
      ScrollTrigger.refresh();

      // 4. Contract to reveal new theme
      gsap.to(wipe, {
        clipPath: `circle(0% at ${x}% ${y}%)`,
        duration: 0.48,
        ease: 'power2.out',
        delay: 0.05,
        onComplete: () => {
          wipe.style.opacity = '0';
          wipe.style.pointerEvents = 'none';
          gsap.set(wipe, { clipPath: 'none' });
        }
      });
    }
  });
}

function updateCursorVisibility(theme) {
  if (theme === 'dark' && !window.matchMedia('(hover: none)').matches) {
    document.body.classList.add('cursor-ready');
  } else {
    document.body.classList.remove('cursor-ready');
  }
}

function initTheme() {
  const preferred = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', preferred);
  localStorage.setItem(THEME_KEY, preferred);
  updateCursorVisibility(preferred);

  const toggleFixed = $('theme-toggle-fixed');
  if (toggleFixed) {
    toggleFixed.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark', true);
    });
  }
}

/* ─── PRELOADER ─── */
function initPreloader() {
  const preloader = $('preloader');
  if (!preloader) return;

  const safety = setTimeout(() => {
    document.body.style.overflow = '';
    gsap.to(preloader, { opacity: 0, duration: 0.6, onComplete: () => preloader.style.display = 'none' });
  }, 3200);

  const wordmark = $('pl-wordmark');
  const tagline  = $('pl-tagline');
  const bar      = $('pl-bar');
  document.body.style.overflow = 'hidden';

  const chars = wordmark ? splitChars(wordmark) : [];

  const tl = gsap.timeline({
    onComplete: () => {
      clearTimeout(safety);
      document.body.style.overflow = '';
      gsap.to(preloader, {
        opacity: 0, duration: 0.7, ease: 'power2.inOut',
        onComplete: () => { preloader.style.display = 'none'; }
      });
    }
  });

  tl.set(chars,   { opacity: 0, y: 36, rotateX: -80, transformOrigin: '50% 100%' })
    .set(tagline, { opacity: 0, y: 16, filter: 'blur(6px)' })
    .set(bar,     { scaleX: 0, transformOrigin: 'left center' });

  tl.to(chars, {
    opacity: 1, y: 0, rotateX: 0,
    duration: 0.48, ease: 'expo.out', stagger: 0.028
  }, 0.08)
  .to(tagline, {
    opacity: 1, y: 0, filter: 'blur(0px)',
    duration: 0.45, ease: 'expo.out'
  }, 0.55)
  .to(bar, {
    scaleX: 1, duration: 0.7, ease: 'expo.inOut'
  }, 0.9)
  .to([chars, tagline, bar], {
    opacity: 0, y: -16, stagger: 0.015,
    duration: 0.5, ease: 'power2.in'
  }, 1.9);
}

/* ─── CUSTOM CURSOR ─── */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  const ring = document.querySelector('[data-cursor]');
  const dot  = document.querySelector('[data-cursor-dot]');
  if (!ring || !dot) return;

  ring.style.display = 'block';
  dot.style.display  = 'block';

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let pos   = { x: mouse.x, y: mouse.y };
  let isHovering = false;

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(dot, { x: mouse.x, y: mouse.y });
  });

  function tick() {
    pos.x = lerp(pos.x, mouse.x, 0.13);
    pos.y = lerp(pos.y, mouse.y, 0.13);
    gsap.set(ring, { x: pos.x, y: pos.y });
    requestAnimationFrame(tick);
  }
  tick();

  const hoverEls = 'a, button, [role="button"], .peek-card, .rose-app, video';
  document.addEventListener('mouseover', e => {
    if (e.target.matches(hoverEls) || e.target.closest(hoverEls)) {
      if (!isHovering) {
        isHovering = true;
        gsap.to(ring, {
          width: 56, height: 56,
          background: 'rgba(212,168,67,0.12)',
          borderColor: 'rgba(212,168,67,0.75)',
          duration: 0.32, ease: 'expo.out'
        });
        gsap.to(dot, { opacity: 0, duration: 0.18 });
      }
    }
  });
  document.addEventListener('mouseout', e => {
    if (!e.target.closest(hoverEls)) {
      isHovering = false;
      gsap.to(ring, {
        width: 32, height: 32,
        background: 'transparent',
        borderColor: 'rgba(212,168,67,0.45)',
        duration: 0.32, ease: 'expo.out'
      });
      gsap.to(dot, { opacity: 1, duration: 0.18 });
    }
  });

  document.addEventListener('mouseleave', () => gsap.to([ring, dot], { opacity: 0, duration: 0.25 }));
  document.addEventListener('mouseenter', () => gsap.to([ring, dot], { opacity: 1, duration: 0.25 }));
}

/* ─── NAV ─── */
function initNav() {
  const nav = $('nav');
  if (!nav) return;

  // Fix: if page loaded mid-scroll, apply pill immediately
  if (window.scrollY > 20) nav.classList.add('scrolled');

  ScrollTrigger.create({
    start: 'top -20px',
    onEnter:     () => nav.classList.add('scrolled'),
    onLeaveBack: () => {
      nav.classList.remove('scrolled');
      if (window.innerWidth > 680) {
        const mob = $('mob');
        if (mob) mob.classList.remove('open');
      }
    }
  });

  const ham = $('ham');
  const mob = $('mob');
  if (ham && mob) {
    ham.addEventListener('click', () => mob.classList.toggle('open'));
  }
  window.closeMob = () => { if (mob) mob.classList.remove('open'); };

}

/* ─── HERO ─── */
function initHero() {
  const hero = $('hero');
  if (!hero) return;

  const heading = document.querySelector('.hero-h');
  const sub = document.querySelector('.hero-sub');
  const ctaRow = document.querySelector('.hero-cta-row');
  const contactL = document.querySelector('.hero-contact-line');
  const scrollHint = $('hero-scroll-hint');

  // Hero bg is an iframe; CSS already handles opacity via #hero-bg-video-wrap

  const delay = $('preloader') ? 3.6 : 0.25;
  const wordInners = heading ? splitWords(heading) : [];

  const heroTL = gsap.timeline({ delay });

  if (wordInners.length) {
    heroTL.from(wordInners, {
      y: '105%', duration: 0.85, ease: 'expo.out', stagger: 0.038
    }, 0);
  }
  [sub, ctaRow, contactL].forEach((el, i) => {
    if (!el) return;
    heroTL.from(el, {
      opacity: 0, y: 18, filter: 'blur(4px)',
      duration: 0.65, ease: 'expo.out'
    }, 0.45 + i * 0.12);
  });

  if (scrollHint) {
    gsap.to(scrollHint, {
      y: 7, repeat: -1, yoyo: true,
      duration: 1.3, ease: 'sine.inOut'
    });
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '28% top',
      onUpdate: self => {
        gsap.set(scrollHint, { opacity: 1 - self.progress * 2.2 });
      }
    });
  }
}

/* ─── ROSE SECTION (contained frame — no pin, scrub through section) ─── */
function initROSeSection() {
  const section = $('rose');
  if (!section) return;

  const panels = $$('.rose-panel');
  const apps   = $$('.rose-app');
  const overlay = $('rose-overlay');

  gsap.set(panels, { opacity: 0, y: 24 });
  gsap.set(apps,   { opacity: 0, x: -16 });
  if (panels[0]) {
    gsap.set(panels[0], { opacity: 1, y: 0 });
    panels[0].classList.add('is-active');
  }

  const total = Math.max(panels.length, 1);
  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    end: 'bottom 30%',
    scrub: 0.85,
    onUpdate: self => {
      const progress = self.progress;
      const panelIndex = Math.min(Math.floor(progress * total), total - 1);
      const panelProgress = (progress * total) - panelIndex;

      panels.forEach((panel, i) => {
        if (i === panelIndex) {
          panel.classList.add('is-active');
          gsap.set(panel, {
            opacity: clamp(0.2 + panelProgress * 2.2, 0, 1),
            y: clamp((1 - panelProgress * 2) * 16, 0, 16)
          });
        } else {
          panel.classList.remove('is-active');
          gsap.set(panel, {
            opacity: 0,
            y: i < panelIndex ? -16 : 20
          });
        }
      });

      if (panelIndex === 1) {
        apps.forEach((app, i) => {
          const p = clamp((panelProgress - i * 0.1) * 2.5, 0, 1);
          gsap.set(app, { opacity: p, x: (1 - p) * -16 });
        });
      } else {
        gsap.set(apps, { opacity: 0, x: -16 });
      }

      if (overlay) {
        gsap.set(overlay, { opacity: clamp(0.55 + progress * 0.2, 0.55, 0.82) });
      }
    }
  });
}

/* ─── SCROLL REVEALS ─── */
function initScrollReveals() {
  // Ensure elements are visible even if ScrollTrigger is slow or fails
  $$('.reveal, .reveal-words, .reveal-chars').forEach(el => {
    el.style.opacity = '1';
  });

  $$('.reveal').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0.01, y: 28 },
      {
        opacity: 1, y: 0,
        duration: 0.8, ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  $$('.reveal-words').forEach(el => {
    const inners = splitWords(el);
    if (!inners.length) return;
    gsap.fromTo(inners,
      { y: '100%' },
      {
        y: '0%',
        duration: 0.75, ease: 'expo.out', stagger: 0.04,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}

/* ─── VIDEO MODAL ─── */
function initVideoModal() {
  const overlay = $('peek-modal-overlay');
  const mTitle  = $('peek-modal-title');
  const mType   = $('peek-modal-type');
  const mVideo  = $('peek-modal-video');
  const mClose  = $('peek-modal-close');
  if (!overlay) return;

  function openModal(title, type, vimeoId) {
    mTitle.textContent = title;
    mType.textContent  = type;
    mVideo.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=0&loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" title="${title}"></iframe>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('open');
    mVideo.innerHTML = '';
    document.body.style.overflow = '';
  }

  $$('.peek-card').forEach(card => {
    card.addEventListener('click', () => {
      openModal(
        card.getAttribute('data-title'),
        card.getAttribute('data-type'),
        card.getAttribute('data-vimeo')
      );
    });
  });
  if (mClose) mClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ─── ROSE MODAL ─── */
function initROSeModal() {
  const overlay  = $('rose-modal-overlay');
  const closeBtn = $('rose-modal-close');
  const learnBtn = $('rose-learn-more');
  const footerLearn = $('rose-footer-learn');

  function openModal() {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const inner = document.querySelector('#rose-modal');
    if (inner) gsap.from(inner, { y: 24, opacity: 0, scale: 0.97, duration: 0.4, ease: 'expo.out' });
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  const closeBottom = $('rose-modal-close-bottom');
  if (learnBtn) learnBtn.addEventListener('click', openModal);
  if (footerLearn) footerLearn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBottom) closeBottom.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closeModal();
  });
}

/* ─── CONTACT FORM ─── */
function initContact() {
  const form = $('contact-form');
  const btn  = $('cf-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        window.location.href = 'https://tenneri.com/thank-you';
      } else throw new Error();
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send message →';
      alert('Something went wrong. Email me at ramano@tenneri.com');
    }
  });

  const heroLink = $('hero-contact-link');
  if (heroLink) {
    heroLink.addEventListener('click', e => {
      e.preventDefault();
      const contact = $('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

/* ─── EXTRAS ─── */
function openPhishingModal() {
  const overlay = $('peek-modal-overlay');
  const mTitle  = $('peek-modal-title');
  const mType   = $('peek-modal-type');
  const mVideo  = $('peek-modal-video');
  if (!overlay || !mVideo) return;
  mTitle.textContent = 'Phishing training simulation';
  mType.textContent  = 'Cybersecurity · Brightspace / D2L';
  mVideo.innerHTML = `<iframe src="https://player.vimeo.com/video/1169432096?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=0&loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" title="Phishing training simulation"></iframe>`;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function initExtras() {
  const yearEl = $('foot-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const heroLearn = $('hero-video-learn');
  const heroWatch = $('hero-video-watch');
  if (heroLearn) heroLearn.addEventListener('click', openPhishingModal);
  if (heroWatch) heroWatch.addEventListener('click', openPhishingModal);

  // Tab-out easter egg — 3s delay, one title only
  const originalTitle = document.title || 'Tenneri';
  let awayTimer = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      awayTimer = setTimeout(() => {
        document.title = 'Your learners would never tab out · Tenneri';
      }, 3000);
    } else {
      clearTimeout(awayTimer);
      document.title = originalTitle;
    }
  });

  // Triple-click logo → flip theme
  const logo = document.querySelector('.n-logo');
  if (logo) {
    let clicks = 0;
    let timer = null;
    logo.addEventListener('click', () => {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 600);
      if (clicks >= 3) {
        clicks = 0;
        const toggle = $('theme-toggle-fixed');
        if (toggle) toggle.click();
      }
    });
  }
}

/* ─── FILM STRIP NAV ─── */
function initFilmStrip() {
  const strip = $('strip');
  if (!strip || window.innerWidth < 981) return;

  const SECTIONS = $$('.sec[data-section], #rose[data-section]');
  if (!SECTIONS.length) return;

  const stripTop    = $('strip-top');
  const stripBottom = $('strip-bottom');
  const rulerEl     = $('ruler');
  const needle      = $('needle');
  const pctEl       = $('needle-pct');
  if (!rulerEl || !needle) return;

  const brand = $('strip-brand');
  if (brand) {
    brand.style.cursor = 'pointer';
    brand.title = 'Back to top';
    brand.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Ticks
  for (let i = 0; i <= 100; i++) {
    const major = i % 5 === 0;
    const tick  = document.createElement('div');
    tick.className = 'tick';
    tick.style.top = i + '%';
    const line = document.createElement('div');
    line.className = major ? 'tick-line-major' : 'tick-line-minor';
    tick.appendChild(line);
    if (major && i > 0 && i < 100) {
      const num = document.createElement('div');
      num.className = 'tick-num';
      num.textContent = i;
      tick.appendChild(num);
    }
    rulerEl.appendChild(tick);
  }

  // Three states per section:
  //   past     → horizontal label in strip-top
  //   active   → vertical label on the ruler
  //   upcoming → horizontal label in strip-bottom
  const pastLabels = {};
  const activeLabels = {};
  const upcomingLabels = {};
  const sectionState = {};
  const labelAnimGen = {}; // generation counter per section — cancels stale callbacks

  function scrollToSec(sec) {
    const top = sec.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  SECTIONS.forEach(sec => {
    const name = sec.dataset.section;
    sectionState[name] = 'upcoming';

    const upcoming = document.createElement('button');
    upcoming.className = 'strip-upcoming-label';
    upcoming.textContent = name;
    upcoming.type = 'button';
    upcoming.addEventListener('click', () => scrollToSec(sec));
    stripBottom.appendChild(upcoming);
    upcomingLabels[name] = upcoming;

    const past = document.createElement('button');
    past.className = 'strip-past-label';
    past.textContent = name;
    past.type = 'button';
    past.addEventListener('click', () => scrollToSec(sec));
    stripTop.appendChild(past);
    pastLabels[name] = past;

    // Vertical active label lives on the ruler (hidden until active)
    const active = document.createElement('button');
    active.className = 'strip-active-label';
    active.textContent = name;
    active.type = 'button';
    active.addEventListener('click', () => scrollToSec(sec));
    rulerEl.appendChild(active);
    activeLabels[name] = active;
  });

  function positionActiveLabels() {
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    if (totalH <= 0) return;
    SECTIONS.forEach(sec => {
      const name = sec.dataset.section;
      const el = activeLabels[name];
      if (!el) return;
      // Place at the mid-point of the section along the page
      const mid = sec.offsetTop + sec.offsetHeight * 0.35;
      const pct = (mid / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      el.style.top = Math.min(88, Math.max(8, pct)) + '%';
    });
  }

  function setState(sec, newState) {
    const name = sec.dataset.section;
    if (sectionState[name] === newState) return;
    sectionState[name] = newState;

    const upcoming = upcomingLabels[name];
    const past = pastLabels[name];
    const active = activeLabels[name];

    // Bump generation — stale exit-animation callbacks check this before hiding
    labelAnimGen[name] = (labelAnimGen[name] || 0) + 1;
    const myGen = labelAnimGen[name];

    // Reset horizontal strip labels immediately
    if (upcoming) upcoming.classList.remove('fading', 'is-current');
    if (past) past.classList.remove('visible');

    if (newState === 'active') {
      // Hide horizontal copies; show stacked-column ruler label
      if (upcoming) upcoming.classList.add('fading');
      if (active) {
        active.classList.add('visible');
        // Split into chars, each starts lying flat (rotateZ -90°) and stands upright (0°)
        const chars = splitChars(active);
        gsap.fromTo(chars,
          { opacity: 0, rotateZ: -90, transformOrigin: '50% 50%' },
          {
            opacity: 1, rotateZ: 0, stagger: 0.055, duration: 0.55,
            ease: 'expo.out', overwrite: 'auto'
          }
        );
      }
    } else if (newState === 'past') {
      if (upcoming) upcoming.classList.add('fading');
      if (past) past.classList.add('visible');
      if (active) {
        const chars = active.querySelectorAll('.char');
        if (chars.length) {
          // Letters fall forward (rotate to +90°) as section scrolls past
          gsap.to(chars, {
            opacity: 0, rotateZ: 90, transformOrigin: '50% 50%',
            stagger: 0.03, duration: 0.32, ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => {
              if (labelAnimGen[name] === myGen) active.classList.remove('visible');
            }
          });
        } else {
          active.classList.remove('visible');
        }
      }
    } else {
      // upcoming — letters fall back (rotate to -90°)
      if (upcoming) upcoming.classList.remove('fading');
      if (active) {
        const chars = active.querySelectorAll('.char');
        if (chars.length) {
          gsap.to(chars, {
            opacity: 0, rotateZ: -90, transformOrigin: '50% 50%',
            stagger: 0.03, duration: 0.32, ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => {
              if (labelAnimGen[name] === myGen) active.classList.remove('visible');
            }
          });
        } else {
          active.classList.remove('visible');
        }
      }
    }
  }

  // Sync triggers: one active section at a time, aligned to viewport center
  SECTIONS.forEach((sec, idx) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter() { setState(sec, 'active'); },
      onLeave() { setState(sec, 'past'); },
      onEnterBack() {
        setState(sec, 'active');
        SECTIONS.slice(idx + 1).forEach(s => {
          if (sectionState[s.dataset.section] !== 'upcoming') {
            setState(s, 'upcoming');
          }
        });
      },
      onLeaveBack() { setState(sec, 'upcoming'); }
    });
  });

  positionActiveLabels();
  window.addEventListener('resize', () => {
    clearTimeout(window.__stripPos);
    window.__stripPos = setTimeout(positionActiveLabels, 120);
  });

  let targetPct = 0, currentPct = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      targetPct = self.progress * 100;
      if (pctEl) pctEl.textContent = String(Math.round(self.progress * 100)).padStart(3, '0') + '%';
    }
  });
  gsap.ticker.add(() => {
    currentPct += (targetPct - currentPct) * 0.08;
    needle.style.top = currentPct + '%';
  });

  // Ruler click / hover
  const hoverEl = $('ruler-hover');
  const hoverPct = $('ruler-hover-pct');
  const hoverBand = $('ruler-hover-band');
  rulerEl.addEventListener('mousemove', e => {
    const rect = rulerEl.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const pct = (y / rect.height) * 100;
    if (hoverEl) hoverEl.style.top = pct + '%';
    if (hoverPct) hoverPct.textContent = Math.round(pct) + '%';
    if (hoverBand) {
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = (pct / 100) * totalH;
      let found = null;
      SECTIONS.forEach(sec => {
        if (sec.offsetTop <= scrollY + window.innerHeight * 0.4) found = sec;
      });
      if (found && totalH > 0) {
        const start = (found.offsetTop / totalH) * 100;
        const end = ((found.offsetTop + found.offsetHeight) / totalH) * 100;
        hoverBand.style.top = start + '%';
        hoverBand.style.height = Math.max(2, end - start) + '%';
      }
    }
  });
  rulerEl.addEventListener('click', e => {
    const rect = rulerEl.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const pct = (y / rect.height) * 100;
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (pct / 100) * totalH, behavior: 'smooth' });
  });

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      positionActiveLabels();
      ScrollTrigger.refresh();
    });
  });
}

/* ─── INIT ─── */
function init() {
  initTheme();
  initPreloader();
  initCursor();
  initNav();
  initHero();
  initROSeSection();
  initScrollReveals();
  initVideoModal();
  initROSeModal();
  initContact();
  initExtras();
  initFilmStrip();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('resize', () => {
  clearTimeout(window.__rsz);
  window.__rsz = setTimeout(() => ScrollTrigger.refresh(), 220);
});
