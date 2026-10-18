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
  // Wrap each word in place, keeping <em>, <br> and other markup intact
  const wrapText = node => {
    const parts = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach(w => {
      if (!w) return;
      if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.style.cssText = 'display:inline-block;overflow:hidden';
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.style.display = 'inline-block';
      inner.textContent = w;
      outer.appendChild(inner);
      frag.appendChild(outer);
    });
    node.replaceWith(frag);
  };
  const walk = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) wrapText(child);
      else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    });
  };
  walk(el);
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
  let stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme, animate = true) {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  if (current === theme) return;

  const apply = () => {
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    updateCursorVisibility(theme);
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reduce) { apply(); return; }

  // No View Transitions support: the page's own color transitions crossfade it
  if (!document.startViewTransition) {
    apply();
    setTimeout(() => ScrollTrigger.refresh(), 850);
    return;
  }

  // Circular reveal: the new theme grows out of the toggle over the old one,
  // while the old page dims behind it
  const toggle = $('theme-toggle-fixed');
  let x = window.innerWidth - 40, y = 40;
  if (toggle) {
    const r = toggle.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  html.classList.add('theme-switching');
  const t = document.startViewTransition(apply);
  t.ready.then(() => {
    const ease = 'cubic-bezier(0.7, 0, 0.2, 1)';
    html.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 1000, easing: ease, pseudoElement: '::view-transition-new(root)' }
    );
    html.animate(
      { filter: ['brightness(1)', 'brightness(0.55)'] },
      { duration: 1000, easing: ease, pseudoElement: '::view-transition-old(root)' }
    );
  }).catch(() => {});
  t.finished.finally(() => {
    html.classList.remove('theme-switching');
    ScrollTrigger.refresh();
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
let introPlayed = false;
function initPreloader() {
  const preloader = $('preloader');
  if (!preloader) return;

  // Only play the intro once per session, so a refresh or tab return lands straight on the page
  let seen = false;
  try {
    seen = sessionStorage.getItem('tenneri-intro') === '1';
    sessionStorage.setItem('tenneri-intro', '1');
  } catch (e) {}
  if (seen) {
    preloader.style.display = 'none';
    return;
  }
  introPlayed = true;

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
  const ham = $('ham');
  const mob = $('mob');

  // State comes straight from scrollY, so a refresh, restored scroll, or bfcache return can never desync it
  let lastScrolled = null;
  function syncNav() {
    const scrolled = window.scrollY > 20;
    if (scrolled === lastScrolled) return;
    lastScrolled = scrolled;
    nav.classList.toggle('scrolled', scrolled);
    if (!scrolled && window.innerWidth > 680 && mob) mob.classList.remove('open');
  }
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });
  window.addEventListener('load', syncNav);
  window.addEventListener('pageshow', syncNav);
  window.addEventListener('resize', syncNav);

  if (ham && mob) {
    ham.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      ham.setAttribute('aria-expanded', String(open));
    });
  }
  window.closeMob = () => {
    if (mob) mob.classList.remove('open');
    if (ham) ham.setAttribute('aria-expanded', 'false');
  };
}

/* ─── HERO ─── */
function initHero() {
  const hero = $('hero');
  if (!hero) return;

  const heading = document.querySelector('.hero-h');
  const sub = document.querySelector('.hero-sub');
  const ctaRow = document.querySelector('.hero-cta-row');
  const contactL = document.querySelector('.hero-contact-line');
  const avail = document.querySelector('.hero-avail');
  const scrollHint = $('hero-scroll-hint');

  // Hero bg is an iframe; CSS already handles opacity via #hero-bg-video-wrap

  const delay = introPlayed ? 3.6 : 0.25;
  const wordInners = heading ? splitWords(heading) : [];

  const heroTL = gsap.timeline({ delay });

  if (wordInners.length) {
    heroTL.from(wordInners, {
      y: '105%', duration: 0.85, ease: 'expo.out', stagger: 0.038
    }, 0);
  }
  [sub, ctaRow, avail, contactL].forEach((el, i) => {
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
  $$('.rose-panel').forEach(panel => {
    panel.classList.add('is-active');
    gsap.set(panel, { opacity: 1, y: 0, clearProps: 'transform' });
  });
  $$('.rose-app').forEach(app => gsap.set(app, { opacity: 1, x: 0 }));
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
        clearProps: 'transform',
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
    if (mClose) mClose.focus();
  }
  function closeModal() {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    mVideo.innerHTML = '';
    document.body.style.overflow = '';
  }

  $$('.peek-card').forEach(card => {
    const open = () => openModal(
      card.getAttribute('data-title'),
      card.getAttribute('data-type'),
      card.getAttribute('data-vimeo')
    );
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
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
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
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
  mVideo.innerHTML = `<iframe src="https://player.vimeo.com/video/1236921375?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=0&loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" title="Phishing training simulation"></iframe>`;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function initExtras() {
  const yearEl = $('foot-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const heroLearn = $('hero-video-learn');
  const heroWatch = $('hero-video-watch');
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

  // One label per section. Each letter is its own element so the word can
  // stretch like a slinky as it travels:
  //   upcoming → horizontal, stacked at the bottom
  //   active   → letters peel off one by one and stack vertically on the ruler
  //   past     → letters peel off again and settle horizontally at the top
  const labels = {};
  const sectionState = {};

  const layer = document.createElement('div');
  layer.id = 'strip-labels';
  strip.appendChild(layer);

  function scrollToSec(sec) {
    const top = sec.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  SECTIONS.forEach(sec => {
    const name = sec.dataset.section;
    sectionState[name] = null;
    const el = document.createElement('button');
    el.className = 'strip-travel';
    el.type = 'button';
    el.setAttribute('aria-label', 'Go to ' + name);
    el.innerHTML = name.split('').map(c =>
      `<span class="strip-char" aria-hidden="true">${c === ' ' ? ' ' : c}</span>`
    ).join('');
    el.addEventListener('click', e => {
      e.stopPropagation();
      scrollToSec(sec);
    });
    layer.appendChild(el);
    const chars = Array.from(el.children);
    gsap.set(chars, { xPercent: -50, yPercent: -50 });
    labels[name] = { el, chars, cy: null, state: null };
  });

  // Letters render at their real size in every state (no scale transform),
  // so the text stays sharp. DM Mono is monospaced: one probe covers every letter.
  let charW = 8, FS_REST = 9.6, FS_ACTIVE = 16.8;
  function measure() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    FS_REST = 0.6 * rem;
    FS_ACTIVE = 1.05 * rem;
    const probe = document.createElement('span');
    probe.className = 'strip-char';
    probe.style.cssText = 'visibility:hidden;font-size:' + FS_REST + 'px';
    probe.textContent = 'M';
    layer.appendChild(probe);
    charW = (probe.offsetWidth || FS_REST * 0.6) + FS_REST * 0.14;
    probe.remove();
  }

  function sectionScrollPct(sec) {
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    if (totalH <= 0) return 0.45;
    const start = sec.offsetTop / totalH;
    const end = (sec.offsetTop + sec.offsetHeight) / totalH;
    return Math.min(0.82, Math.max(0.18, start + (end - start) * 0.42));
  }

  const PAD = 10;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layoutLabels(animate) {
    const past = SECTIONS.filter(s => sectionState[s.dataset.section] === 'past');
    const upcoming = SECTIONS.filter(s => sectionState[s.dataset.section] === 'upcoming');
    const brandH = brand ? brand.offsetHeight + 28 : 46;
    const row = 22;
    const topH = brandH + past.length * row + 6;
    const botH = 14 + Math.max(upcoming.length, 1) * row + 10;
    const dur = animate ? 0.9 : 0;
    const ease = 'power3.inOut';

    gsap.to(stripTop, { height: topH, duration: dur, ease, overwrite: 'auto' });
    gsap.to(stripBottom, { height: botH, duration: dur, ease, overwrite: 'auto' });

    const stripW = strip.clientWidth;
    const stripH = strip.clientHeight || window.innerHeight;
    const rulerTop = topH;
    const rulerH = Math.max(80, stripH - topH - botH);

    SECTIONS.forEach(sec => {
      const name = sec.dataset.section;
      const L = labels[name];
      const state = sectionState[name];
      const n = L.chars.length;
      L.el.classList.toggle('is-active', state === 'active');

      let cy, targets;
      if (state === 'active') {
        cy = rulerTop + rulerH * sectionScrollPct(sec);
        const cx = Math.round(stripW * 0.42);
        const step = charW * (FS_ACTIVE / FS_REST);
        // Reads bottom to top: first letter lowest
        targets = L.chars.map((c, i) => ({
          x: cx, y: Math.round(cy + ((n - 1) / 2 - i) * step),
          rotation: -90, fontSize: FS_ACTIVE
        }));
      } else {
        cy = state === 'past'
          ? brandH + 4 + past.indexOf(sec) * row
          : stripH - (16 + (upcoming.length - 1 - upcoming.indexOf(sec)) * row);
        const right = stripW - PAD;
        targets = L.chars.map((c, i) => ({
          x: Math.round(right - (n - i - 0.5) * charW), y: Math.round(cy),
          rotation: 0, fontSize: FS_REST
        }));
      }

      const changedState = L.state !== state;
      const movingUp = L.cy !== null && cy < L.cy;
      L.cy = cy;
      L.state = state;

      if (!animate) {
        L.chars.forEach((c, i) => {
          gsap.killTweensOf(c);
          gsap.set(c, { ...targets[i], force3D: false });
        });
        return;
      }

      // The letter nearest the destination leads, the rest trail behind it.
      // Bigger gaps on a state change give the stretch; a plain row shift stays tight.
      const lead = movingUp ? n - 1 : 0;
      const gap = changedState ? 0.07 : 0.015;
      L.chars.forEach((c, i) => {
        gsap.to(c, {
          ...targets[i],
          force3D: false,
          duration: changedState ? 0.9 : 0.6,
          ease: changedState ? 'power2.inOut' : 'power2.out',
          delay: Math.abs(i - lead) * gap,
          overwrite: true
        });
      });
    });
  }

  // Section state is derived from where each section sits right now, not from
  // enter/leave events. That way a refresh mid-scroll always lands on the truth.
  function syncStates(animate) {
    const line = window.innerHeight * 0.5;
    let changed = false;
    SECTIONS.forEach(sec => {
      const r = sec.getBoundingClientRect();
      const st = r.bottom <= line ? 'past' : (r.top > line ? 'upcoming' : 'active');
      if (sectionState[sec.dataset.section] !== st) {
        sectionState[sec.dataset.section] = st;
        changed = true;
      }
    });
    if (changed) layoutLabels(animate && !reduceMotion);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      syncStates(true);
    });
  }, { passive: true });

  // Needle reads scrollY directly every frame, so it is never stale after a refresh
  let currentPct = null;
  let lastPctText = '';
  function scrollPct() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max, 0, 1) * 100 : 0;
  }
  gsap.ticker.add(() => {
    const target = scrollPct();
    if (currentPct === null) currentPct = target;
    currentPct += (target - currentPct) * 0.08;
    needle.style.top = currentPct + '%';
    const txt = String(Math.round(target)).padStart(3, '0') + '%';
    if (pctEl && txt !== lastPctText) { pctEl.textContent = txt; lastPctText = txt; }
  });

  // Hard resync: snap everything to the current scroll position
  function hardSync() {
    measure();
    syncStates(false);
    layoutLabels(false);
    currentPct = null;
  }
  hardSync();

  window.addEventListener('resize', () => {
    clearTimeout(window.__stripPos);
    window.__stripPos = setTimeout(hardSync, 120);
  });
  window.addEventListener('pageshow', hardSync);
  ScrollTrigger.addEventListener('refresh', () => syncStates(false));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hardSync);

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
      ScrollTrigger.refresh();
      hardSync();
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
