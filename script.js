/* ═══════════════════════════════════════════════════════════════
   TENNERI: dual theme engine
   GSAP + ScrollTrigger + Lenis smooth scroll + cinematic theme switch
═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─── UTILITIES ─── */
const $  = id  => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const lerp = (a, b, n) => (1 - n) * a + n * b;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Scale factor: 1 at the base 16px root, larger on big screens (see the fluid scale in style.css)
const remScale = () => (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;

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
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = w;
      outer.appendChild(inner);
      frag.appendChild(outer);
    });
    node.replaceWith(frag);
  };
  const walk = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) wrapText(child);
      else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.matches('[data-nosplit], .sr-only, svg')) walk(child);
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
      : `<span class="char" style="display:inline-block">${c}</span>`
  ).join('');
  return el.querySelectorAll('.char');
}

/* ─── SMOOTH SCROLL ─── */
let lenis = null;
function initSmoothScroll() {
  if (REDUCE || typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToY(y, opts = {}) {
  const top = Math.max(0, y);
  if (lenis) lenis.scrollTo(top, { duration: opts.duration || 1.5, easing: t => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top, behavior: REDUCE ? 'auto' : 'smooth' });
}
function scrollToEl(el) {
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - (el.id === 'hero' ? 0 : 96 * remScale());
  scrollToY(y);
}
function lockScroll(lock) {
  if (lenis) lock ? lenis.stop() : lenis.start();
  document.body.style.overflow = lock ? 'hidden' : '';
}

function initAnchors() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    if (window.closeMob) window.closeMob();
    scrollToEl(target);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });
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
    updateCursorVisibility();
  };

  if (!animate || REDUCE) { apply(); return; }

  if (!document.startViewTransition) {
    apply();
    setTimeout(() => ScrollTrigger.refresh(), 850);
    return;
  }

  // Circular reveal: the new theme grows out of the toggle over the old one
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

function updateCursorVisibility() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.toggle('cursor-ready', fine && !REDUCE);
}

function initTheme() {
  const preferred = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', preferred);
  updateCursorVisibility();

  const toggle = $('theme-toggle-fixed');
  if (toggle) {
    toggle.addEventListener('click', e => {
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

  // Only play the intro once per session
  let seen = false;
  try {
    seen = sessionStorage.getItem('tenneri-intro') === '1';
    sessionStorage.setItem('tenneri-intro', '1');
  } catch (e) {}
  if (seen || REDUCE) {
    preloader.style.display = 'none';
    return;
  }
  introPlayed = true;
  lockScroll(true);

  const finish = () => {
    lockScroll(false);
    gsap.to(preloader, {
      opacity: 0, duration: 0.7, ease: 'power2.inOut',
      onComplete: () => { preloader.style.display = 'none'; }
    });
  };
  const safety = setTimeout(finish, 3400);

  const wordmark = $('pl-wordmark');
  const tagline  = $('pl-tagline');
  const bar      = $('pl-bar');
  const chars = wordmark ? splitChars(wordmark) : [];

  const tl = gsap.timeline({ onComplete: () => { clearTimeout(safety); finish(); } });

  tl.set(chars,   { opacity: 0, y: 36, rotateX: -80, transformOrigin: '50% 100%' })
    .set(tagline, { opacity: 0, y: 16, filter: 'blur(6px)' })
    .set(bar,     { scaleX: 0, transformOrigin: 'left center' });

  tl.to(chars,   { opacity: 1, y: 0, rotateX: 0, duration: 0.48, ease: 'expo.out', stagger: 0.028 }, 0.08)
    .to(tagline, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out' }, 0.55)
    .to(bar,     { scaleX: 1, duration: 0.7, ease: 'expo.inOut' }, 0.9)
    .to([chars, tagline, bar], { opacity: 0, y: -16, stagger: 0.015, duration: 0.5, ease: 'power2.in' }, 1.9);
}

/* ─── CUSTOM CURSOR ───
   The native pointer is hidden on every element in both themes (set on <html>
   before the page paints). A dot tracks the mouse exactly; a ring follows with a
   little lag and stretches in the direction of travel, settling round when the
   mouse stops. Navy in light mode, gold in dark mode, via the --cursor token. */
function initCursor() {
  const root = document.documentElement;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || REDUCE) {
    root.classList.remove('cursor-ready');
    return;
  }
  const ring = document.querySelector('[data-cursor]');
  const dot  = document.querySelector('[data-cursor-dot]');
  if (!ring || !dot) return;

  const shape = document.createElement('span');
  shape.className = 'cursor-shape';
  ring.appendChild(shape);
  const label = document.createElement('span');
  label.className = 'cursor-label';
  ring.appendChild(label);

  const mouse = { x: -200, y: -200 };
  const pos   = { x: -200, y: -200 };
  let live = false, labelled = false;
  const setRing = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
  const setDot  = { x: gsap.quickSetter(dot, 'x', 'px'),  y: gsap.quickSetter(dot, 'y', 'px') };
  const setRot  = gsap.quickSetter(shape, 'rotation', 'deg');
  const setSX   = gsap.quickSetter(shape, 'scaleX');
  const setSY   = gsap.quickSetter(shape, 'scaleY');
  let stretch = 0;

  // pointermove (not mousemove) keeps firing while something is being dragged,
  // and any movement brings the cursor back, for example after the browser's
  // "Open Outlook?" dialog from the email link steals focus.
  const track = e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    setDot.x(mouse.x); setDot.y(mouse.y);
    if (!live) { live = true; pos.x = mouse.x; pos.y = mouse.y; }
    if (!root.classList.contains('cursor-live')) root.classList.add('cursor-live');
  };
  window.addEventListener('pointermove', track, { passive: true, capture: true });
  window.addEventListener('pointerdown', track, { passive: true, capture: true });
  // Hand the real pointer back whenever something outside the page takes over:
  // the "Open Outlook?" prompt from the email link, alerts, other apps.
  // Browsers freeze the cursor at whatever it was when the prompt opened, so
  // the switch to the normal pointer has to land BEFORE the prompt appears.
  // Email and phone links therefore wait a beat: show the real pointer, let
  // the browser apply it, then open the mail app.
  const useNative = on => root.classList.toggle('native-cursor', on);
  let holdNative = 0;
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"], a[href^="tel:"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    useNative(true);
    holdNative = performance.now() + 1500;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => { window.location.href = a.href; }, 120);
    }));
  }, true);
  window.addEventListener('blur', () => { useNative(true); holdNative = performance.now() + 400; });
  window.addEventListener('pagehide', () => useNative(true));
  // Back on the page and moving again: return to the custom cursor
  window.addEventListener('pointermove', () => {
    if (!root.classList.contains('native-cursor')) return;
    if (performance.now() > holdNative && document.hasFocus()) useNative(false);
  }, { passive: true });

  gsap.ticker.add(() => {
    const dx = mouse.x - pos.x, dy = mouse.y - pos.y;
    pos.x += dx * 0.2;
    pos.y += dy * 0.2;
    setRing.x(pos.x); setRing.y(pos.y);
    // Stretch along the direction of travel, eased so it never snaps
    const target = labelled ? 0 : Math.min(Math.hypot(dx, dy) / 140, 0.32);
    stretch += (target - stretch) * 0.18;
    if (stretch > 0.004) setRot(Math.atan2(dy, dx) * 180 / Math.PI);
    setSX(1 + stretch);
    setSY(1 - stretch * 0.45);
  });

  const hoverEls = 'a, button, [role="button"], .peek-card, select, label, [data-cursor-label]';
  const textEls = 'input:not([type="range"]), textarea';
  document.addEventListener('mouseover', e => {
    const t = e.target;
    const isText = !!t.closest(textEls);
    const lab = !isText && t.closest('[data-cursor-label]');
    const isHover = !isText && !!t.closest(hoverEls);
    labelled = !!lab;
    ring.classList.toggle('is-hover', isHover && !lab);
    ring.classList.toggle('has-label', labelled);
    dot.classList.toggle('is-hover', isHover);
    ring.classList.toggle('is-text', isText);
    dot.classList.toggle('is-text', isText);
    // Over gold buttons a gold cursor disappears, so it turns navy there
    const onGold = !isText && !!t.closest('.btn--gold, .n-cta, .cw-copy.is-done');
    ring.classList.toggle('on-gold', onGold);
    dot.classList.toggle('on-gold', onGold);
    if (lab) label.textContent = lab.dataset.cursorLabel;
  });

  document.documentElement.addEventListener('mouseleave', () => root.classList.remove('cursor-live'));
  document.documentElement.addEventListener('mouseenter', () => { if (live) root.classList.add('cursor-live'); });
  document.addEventListener('mousedown', () => gsap.to(dot, { scale: 0.55, duration: 0.12 }));
  document.addEventListener('mouseup', () => gsap.to(dot, { scale: 1, duration: 0.35, ease: 'back.out(3)' }));
}

/* ─── TICKER ───
   One set of items is cloned until the strip is wider than the screen plus one
   set, then the track moves exactly one set width per loop. That keeps the
   loop seamless on any screen width, including ultrawide monitors. */
function initTicker() {
  const track = document.querySelector('.hero-ticker-track');
  const set = track && track.querySelector('.hero-ticker-set');
  if (!track || !set) return;
  const SPEED = 55; // pixels per second

  function build() {
    track.querySelectorAll('.hero-ticker-set[data-clone]').forEach(n => n.remove());
    const w = set.getBoundingClientRect().width;
    if (!w) return;
    const needed = Math.ceil((window.innerWidth + w) / w);
    for (let i = 0; i < needed; i++) {
      const c = set.cloneNode(true);
      c.setAttribute('data-clone', '');
      track.appendChild(c);
    }
    track.style.setProperty('--ticker-set', w + 'px');
    track.style.setProperty('--ticker-dur', (w / SPEED).toFixed(2) + 's');
  }
  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
}

/* ─── NAV ─── */
function initNav() {
  const nav = $('nav');
  if (!nav) return;
  const ham = $('ham');
  const mob = $('mob');

  // State comes straight from scrollY, so a refresh or restored scroll can never desync it
  let lastScrolled = null;
  function syncNav() {
    const scrolled = window.scrollY > 20;
    if (scrolled === lastScrolled) return;
    lastScrolled = scrolled;
    nav.classList.toggle('scrolled', scrolled);
    if (!scrolled && window.innerWidth > 680) window.closeMob();
  }
  window.closeMob = () => {
    if (mob) mob.classList.remove('open');
    if (ham) { ham.setAttribute('aria-expanded', 'false'); ham.setAttribute('aria-label', 'Open menu'); }
  };
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });
  window.addEventListener('load', syncNav);
  window.addEventListener('pageshow', syncNav);
  window.addEventListener('resize', syncNav);

  if (ham && mob) {
    ham.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      ham.setAttribute('aria-expanded', String(open));
      ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeMob(); });
  }
}

/* ─── HERO ─── */
function initHero() {
  const hero = $('hero');
  if (!hero) return;

  const heading = hero.querySelector('.hero-h');
  const rest = [
    hero.querySelector('.hero-eyebrow'),
    hero.querySelector('.hero-sub'),
    hero.querySelector('.hero-cta-row'),
    hero.querySelector('.hero-avail')
  ].filter(Boolean);
  const demo = hero.querySelector('.hero-demo');

  if (REDUCE) return;

  const delay = introPlayed ? 2.55 : 0.15;
  const words = heading ? splitWords(heading) : [];
  const tl = gsap.timeline({ delay });

  if (words.length) tl.from(words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.045 }, 0);

  // The teacher's edit: "have to" rises in with the line, gets crossed out,
  // then "want to" is written in above with a caret
  const edit = heading && heading.querySelector('.edit');
  if (edit) {
    const old    = edit.querySelector('.edit-old');
    const strike = edit.querySelector('.edit-strike path');
    const fresh  = edit.querySelector('.edit-new');
    const caret  = edit.querySelector('.edit-caret path');
    const ink    = getComputedStyle(heading).color;
    tl.from(old, { yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out' }, 0.09)
      .fromTo(strike, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, 1.05)
      .from(old, { color: ink, duration: 0.5, ease: 'power1.out', clearProps: 'color' }, 1.25)
      .fromTo(caret, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, 1.55)
      .fromTo(fresh, { clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0% -20% 0)', duration: 0.75, ease: 'power1.inOut', clearProps: 'clipPath' }, 1.7);
  }
  tl.from(rest, { opacity: 0, y: 20, duration: 0.8, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity' }, 0.35);
  if (demo) tl.from(demo, { opacity: 0, y: 40, scale: 0.97, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.25);

  // As the hero scrolls away, the demo drifts slower than the text for a little depth
  if (demo && window.innerWidth > 980) {
    gsap.to(demo, {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

/* ─── ROSE: the window opens up as it scrolls into view ─── */
function initROSe() {
  const win = document.querySelector('.rose-window');
  if (win && !REDUCE && window.innerWidth > 680) {
    gsap.fromTo(win,
      { scale: 0.86, rotateX: 9, y: 40 },
      {
        scale: 1, rotateX: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: '.rose-stage', start: 'top 92%', end: 'top 22%', scrub: 0.6 }
      }
    );
  }

  const count = $('rose-count');
  if (count && !REDUCE) {
    const target = parseInt(count.textContent, 10) || 66;
    const state = { v: 0 };
    count.textContent = '0';
    ScrollTrigger.create({
      trigger: count,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(state, {
        v: target, duration: 1.8, ease: 'power3.out',
        onUpdate: () => { count.textContent = String(Math.round(state.v)); }
      })
    });
  }
}

/* ─── SCROLL REVEALS ─── */
function initScrollReveals() {
  if (REDUCE) return;

  $$('.reveal').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 36,
      duration: 1, ease: 'expo.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  $$('.reveal-words').forEach(el => {
    const inners = splitWords(el);
    if (!inners.length) return;
    gsap.from(inners, {
      yPercent: 110,
      duration: 1.05, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  const footMark = document.querySelector('.foot-mark');
  if (footMark) {
    gsap.from(footMark, {
      yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true }
    });
  }
}

/* ─── VIDEO MODAL ─── */
let openVideo = () => {};
function initVideoModal() {
  const overlay = $('peek-modal-overlay');
  const mTitle  = $('peek-modal-title');
  const mType   = $('peek-modal-type');
  const mVideo  = $('peek-modal-video');
  const mClose  = $('peek-modal-close');
  const mFs     = $('peek-modal-fs');
  if (!overlay) return;
  let lastFocus = null;
  let closeOnExit = false;

  const canFs = !!(mVideo.requestFullscreen || mVideo.webkitRequestFullscreen);
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function goFullscreen() {
    if (!canFs) return;
    const req = mVideo.requestFullscreen || mVideo.webkitRequestFullscreen;
    try { const p = req.call(mVideo); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }
  if (mFs) {
    if (!canFs) mFs.style.display = 'none';
    mFs.addEventListener('click', () => { closeOnExit = false; goFullscreen(); });
  }

  openVideo = (title, type, vimeoId, opts = {}) => {
    lastFocus = document.activeElement;
    mTitle.textContent = title;
    mType.textContent  = type;
    mVideo.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${title}"></iframe>`;
    overlay.classList.add('open');
    document.documentElement.classList.add('modal-video');
    lockScroll(true);
    if (opts.fullscreen && canFs) {
      // Called straight from the click, so the browser allows it
      closeOnExit = true;
      goFullscreen();
    } else if (!REDUCE) {
      gsap.from(overlay.querySelector('.peek-modal'), { y: 30, opacity: 0, scale: 0.97, duration: 0.5, ease: 'expo.out' });
    }
    if (mClose) mClose.focus({ preventScroll: true });
  };
  function closeModal() {
    if (!overlay.classList.contains('open')) return;
    if (fsEl()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
    overlay.classList.remove('open');
    document.documentElement.classList.remove('modal-video');
    mVideo.innerHTML = '';
    lockScroll(false);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  const onFsChange = () => { if (!fsEl() && closeOnExit) { closeOnExit = false; closeModal(); } };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  $$('.peek-card').forEach(card => {
    const open = () => openVideo(card.dataset.title, card.dataset.type, card.dataset.vimeo);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
  if (mClose) mClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fsEl()) closeModal(); });
}

/* ─── ABOUT: two Ramanos, one photo ───
   Press anywhere on the photo and drag. The divider follows the pointer with a
   little easing, pointer capture keeps the drag alive if you leave the photo,
   and a second finger is ignored mid-drag. A visually hidden slider keeps it
   usable from the keyboard (arrow keys, Home, End). */
function initAboutSplit() {
  const wrap = $('about-split');
  const range = $('as-range');
  if (!wrap || !range) return;

  const state = { v: 50 };
  const cap = wrap.parentElement.querySelector('.about-caption');
  const capName = cap && cap.querySelector('.about-name');
  const capRole = cap && cap.querySelector('.about-role');
  const people = {
    a: { name: 'Ramano Stoute', role: 'Needs analysis and curriculum development' },
    b: { name: 'Stoute, Ramano', role: 'Content creation: multimedia, labs and simulations' }
  };
  let who = 'a';
  const swapCaption = next => {
    if (next === who || !capName) return;
    who = next;
    const apply = () => {
      capName.textContent = people[next].name;
      capRole.textContent = people[next].role;
      cap.classList.toggle('is-b', next === 'b');
    };
    if (REDUCE) { apply(); return; }
    gsap.timeline()
      .to([capName, capRole], { opacity: 0, filter: 'blur(4px)', y: -4, duration: 0.14, ease: 'power2.in', stagger: 0.03 })
      .add(apply)
      .fromTo([capName, capRole], { opacity: 0, filter: 'blur(4px)', y: 6 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.3, ease: 'power3.out', stagger: 0.04, clearProps: 'filter,transform' });
  };
  const render = () => {
    const v = state.v;
    swapCaption(v < 47 ? 'b' : v > 53 ? 'a' : who);
    wrap.style.setProperty('--split', v.toFixed(2) + '%');
    wrap.classList.toggle('hide-a', v < 34);
    wrap.classList.toggle('hide-b', v > 66);
    range.value = Math.round(v);
    range.setAttribute('aria-valuetext', v < 34 ? 'Mostly Stoute, Ramano' : v > 66 ? 'Mostly Ramano Stoute' : 'Half and half');
  };
  const goTo = (v, instant) => {
    v = clamp(v, 3, 97);
    if (instant || REDUCE) { gsap.killTweensOf(state); state.v = v; render(); return; }
    gsap.to(state, { v, duration: 0.35, ease: 'power3.out', overwrite: true, onUpdate: render });
  };
  render();

  let dragging = false, pointerId = null, intro = null;
  const pctFrom = e => {
    const r = wrap.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  wrap.addEventListener('pointerdown', e => {
    if (dragging || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (intro) { intro.kill(); intro = null; }
    dragging = true; pointerId = e.pointerId;
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    wrap.classList.add('is-dragging');
    goTo(pctFrom(e));
    e.preventDefault();
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pointerId) return;
    gsap.killTweensOf(state);
    gsap.to(state, { v: clamp(pctFrom(e), 3, 97), duration: 0.12, ease: 'power2.out', onUpdate: render });
  });
  const end = e => {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false; pointerId = null;
    wrap.classList.remove('is-dragging');
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('lostpointercapture', end);
  // Double click snaps back to an even split
  wrap.addEventListener('dblclick', () => goTo(50));

  range.addEventListener('input', () => goTo(+range.value, true));
  range.addEventListener('focus', () => wrap.classList.add('is-focused'));
  range.addEventListener('blur', () => wrap.classList.remove('is-focused'));

  // One gentle sweep the first time it scrolls into view, so people know it moves
  if (!REDUCE) {
    ScrollTrigger.create({
      trigger: wrap, start: 'top 70%', once: true,
      onEnter: () => {
        if (dragging) return;
        intro = gsap.timeline({ delay: 0.5, onUpdate: render })
          .to(state, { v: 72, duration: 0.8, ease: 'power2.inOut' })
          .to(state, { v: 30, duration: 1, ease: 'power2.inOut' })
          .to(state, { v: 50, duration: 0.8, ease: 'power3.out' });
      }
    });
  }
}

/* ─── ACTIVE NAV LINK ─── underlines the nav item for the section in view */
function initActiveNav() {
  const links = $$('.n-links a[href^="#"]');
  links.forEach(a => {
    const sec = $(a.getAttribute('href').slice(1));
    if (!sec || a.classList.contains('n-cta')) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: self => a.classList.toggle('is-current', self.isActive)
    });
  });
}

/* ─── MAGNETIC BUTTONS ─── primary buttons lean a few pixels toward the pointer */
function initMagnetic() {
  if (REDUCE || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $$('.btn--gold, .n-cta').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * 10);
      yTo(((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ─── COPY EMAIL ─── */
function initCopyEmail() {
  const btn = $('cw-copy');
  const toast = $('toast');
  if (!btn) return;
  let t;
  const show = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(t);
    t = setTimeout(() => toast.classList.remove('show'), msg.length > 40 ? 4200 : 2200);
  };
  // Clicking the mail link: say what is happening, and point to Copy for anyone
  // without a mail app set up (common on work machines)
  $$('a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => {
    show('Opening your email app. No app set up? Use Copy instead.');
  }));

  btn.addEventListener('click', async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      btn.classList.add('is-done');
      btn.querySelector('span').textContent = 'Copied';
      show('Email copied: ' + email);
      setTimeout(() => { btn.classList.remove('is-done'); btn.querySelector('span').textContent = 'Copy'; }, 2200);
    } catch (e) {
      show(email);
    }
  });
}

/* ─── ROSE MODAL ─── */
function initROSeModal() {
  const overlay = $('rose-modal-overlay');
  if (!overlay) return;
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.scrollTop = 0;
    lockScroll(true);
    const inner = $('rose-modal');
    if (inner && !REDUCE) gsap.from(inner, { y: 30, opacity: 0, scale: 0.97, duration: 0.5, ease: 'expo.out' });
    const close = $('rose-modal-close');
    if (close) close.focus();
  }
  function closeModal() {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    lockScroll(false);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  ['rose-footer-learn', 'rose-learn-more'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', openModal); });
  ['rose-modal-close', 'rose-modal-close-bottom'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', closeModal); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
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
      btn.textContent = 'Send message';
      alert('The message did not send. Email me directly at ramano@tenneri.com');
    }
  });
}

/* ─── EXTRAS ─── */
function initExtras() {
  const yearEl = $('foot-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const heroWatch = $('hero-video-watch');
  const watchReef = () => openVideo('Reef Guardian', 'Phishing training simulation, built for Brightspace (D2L)', '1236921375', { fullscreen: true });
  if (heroWatch) heroWatch.addEventListener('click', watchReef);
  const heroFrame = $('hero-video-frame');
  if (heroFrame) {
    heroFrame.addEventListener('click', watchReef);
    heroFrame.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); watchReef(); } });
  }

  // Tab-out easter egg
  const originalTitle = document.title || 'Tenneri';
  let awayTimer = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      awayTimer = setTimeout(() => { document.title = 'Your learners would never tab out · Tenneri'; }, 3000);
    } else {
      clearTimeout(awayTimer);
      document.title = originalTitle;
    }
  });

  // Triple-click logo flips the theme
  const logo = document.querySelector('.n-logo');
  if (logo) {
    let clicks = 0, timer = null;
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

/* ─── SECTION RULER (film strip) ─── */
function initFilmStrip() {
  const strip = $('strip');
  if (!strip || strip.dataset.built) return;
  if (window.innerWidth < 981) {
    const later = () => { if (window.innerWidth >= 981) { window.removeEventListener('resize', later); initFilmStrip(); } };
    window.addEventListener('resize', later);
    return;
  }
  strip.dataset.built = '1';

  const SECTIONS = $$('section[data-section]');
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
    brand.addEventListener('click', () => scrollToY(0, { duration: 1.8 }));
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
    if (major && i > 0 && i < 100 && i % 10 === 0) {
      const num = document.createElement('div');
      num.className = 'tick-num';
      num.textContent = i;
      tick.appendChild(num);
    }
    rulerEl.appendChild(tick);
  }

  // One label per section. Each letter is its own element so the word can
  // stretch like a slinky as it travels:
  //   upcoming: horizontal, stacked at the bottom
  //   active:   letters peel off one by one and stack vertically on the ruler
  //   past:     letters peel off again and settle horizontally at the top
  // While a word travels, every letter swells to well over its resting size,
  // then eases back down and settles with a small overshoot when it lands.
  const labels = {};
  const sectionState = {};

  const layer = document.createElement('div');
  layer.id = 'strip-labels';
  strip.appendChild(layer);

  SECTIONS.forEach(sec => {
    const name = sec.dataset.section;
    sectionState[name] = null;
    const el = document.createElement('button');
    el.className = 'strip-travel';
    el.type = 'button';
    el.tabIndex = -1;
    el.setAttribute('aria-label', 'Go to ' + name);
    el.innerHTML = name.split('').map(c =>
      `<span class="strip-char" aria-hidden="true">${c}</span>`
    ).join('');
    el.addEventListener('click', e => { e.stopPropagation(); scrollToEl(sec); });
    layer.appendChild(el);
    const chars = Array.from(el.children);
    gsap.set(chars, { xPercent: -50, yPercent: -50 });
    labels[name] = { el, chars, cy: null, state: null, timer: null };
  });

  // DM Mono is monospaced: one probe covers every letter
  let charW = 8, FS_REST = 10.5, FS_ACTIVE = 18.4;
  function measure() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    k = rem / 16;
    FS_REST = 0.72 * rem;
    FS_ACTIVE = 1.15 * rem;
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

  let k = 1;

  function layoutLabels(animate) {
    const past = SECTIONS.filter(s => sectionState[s.dataset.section] === 'past');
    const upcoming = SECTIONS.filter(s => sectionState[s.dataset.section] === 'upcoming');
    const PAD = 10 * k;
    const brandH = brand ? brand.offsetHeight + 28 * k : 46 * k;
    const row = 24 * k;
    const topH = brandH + past.length * row + 6 * k;
    const botH = 14 * k + Math.max(upcoming.length, 1) * row + 10 * k;
    const dur = animate ? 0.9 : 0;

    gsap.to(stripTop, { height: topH, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(stripBottom, { height: botH, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });

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
          ? brandH + 4 * k + past.indexOf(sec) * row
          : stripH - (16 * k + (upcoming.length - 1 - upcoming.indexOf(sec)) * row);
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
        if (L.timer) { L.timer.kill(); L.timer = null; }
        L.chars.forEach((c, i) => {
          if (c._swell) { c._swell.kill(); c._swell = null; }
          gsap.killTweensOf(c);
          gsap.set(c, { ...targets[i], force3D: false });
        });
        L.el.classList.remove('is-moving');
        return;
      }

      // The letter nearest the destination leads, the rest trail behind it.
      // A state change gets the full morph: wide gaps, a big swell, a soft landing.
      // The gold "moving" colour is cleared on a timer rather than on a tween's
      // completion, so a second scroll that interrupts the first can never leave
      // a label stuck in gold.
      const lead = movingUp ? n - 1 : 0;
      const gap = changedState ? 0.065 : 0.015;
      const dur = changedState ? 1.15 : 0.6;
      if (changedState) {
        L.el.classList.add('is-moving');
        if (L.timer) L.timer.kill();
        L.timer = gsap.delayedCall(dur + (n - 1) * gap, () => {
          L.el.classList.remove('is-moving');
          L.timer = null;
        });
      }
      const morphing = !!L.timer;

      L.chars.forEach((c, i) => {
        const { fontSize, ...pos } = targets[i];
        const delay = Math.abs(i - lead) * gap;

        gsap.to(c, {
          ...pos,
          force3D: false,
          duration: dur,
          ease: changedState ? 'power3.inOut' : 'power2.out',
          delay,
          overwrite: 'auto'
        });

        if (changedState) {
          const from = parseFloat(gsap.getProperty(c, 'fontSize')) || FS_REST;
          const peak = Math.max(from, fontSize) * 1.85;
          // Swell, then settle. Stored per letter so the next morph can cancel it cleanly
          if (c._swell) c._swell.kill();
          c._swell = gsap.timeline({ delay })
            .to(c, { fontSize: peak, duration: dur * 0.48, ease: 'power2.out' })
            .to(c, { fontSize, duration: dur * 0.52, ease: 'back.out(2.2)' });
        } else if (!morphing) {
          gsap.to(c, { fontSize, duration: dur, delay, ease: 'power2.out', overwrite: 'auto' });
        }
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
    if (changed) layoutLabels(animate && !REDUCE);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; syncStates(true); });
  }, { passive: true });

  // Needle reads scrollY every frame, so it is never stale after a refresh
  let currentPct = null;
  let lastPctText = '';
  function scrollPct() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max, 0, 1) * 100 : 0;
  }
  gsap.ticker.add(() => {
    const target = scrollPct();
    if (currentPct === null) currentPct = target;
    currentPct += (target - currentPct) * 0.12;
    needle.style.top = currentPct + '%';
    const txt = String(Math.round(target)).padStart(3, '0') + '%';
    if (pctEl && txt !== lastPctText) { pctEl.textContent = txt; lastPctText = txt; }
  });

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

  // Ruler hover and click
  const hoverEl = $('ruler-hover');
  const hoverPct = $('ruler-hover-pct');
  const hoverBand = $('ruler-hover-band');
  rulerEl.addEventListener('mousemove', e => {
    const rect = rulerEl.getBoundingClientRect();
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    const pct = (y / rect.height) * 100;
    if (hoverEl) hoverEl.style.top = pct + '%';
    if (hoverPct) hoverPct.textContent = Math.round(pct) + '%';
    if (hoverBand) {
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const sy = (pct / 100) * totalH;
      let found = null;
      SECTIONS.forEach(sec => { if (sec.offsetTop <= sy + window.innerHeight * 0.4) found = sec; });
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
    const pct = clamp(e.clientY - rect.top, 0, rect.height) / rect.height;
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    scrollToY(pct * totalH);
  });

  window.addEventListener('load', () => {
    requestAnimationFrame(() => { ScrollTrigger.refresh(); hardSync(); });
  });
}

/* ─── INIT ─── */
function init() {
  initSmoothScroll();
  initTheme();
  initPreloader();
  initCursor();
  initNav();
  initAnchors();
  initTicker();
  initHero();
  initROSe();
  initScrollReveals();
  initVideoModal();
  initROSeModal();
  initAboutSplit();
  initActiveNav();
  initMagnetic();
  initCopyEmail();
  initContact();
  initExtras();
  initFilmStrip();
  window.__tenneriReady = true;
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
