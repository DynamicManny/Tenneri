/* ═══════════════════════════════════════════════════════════════
   TENNERI · Projects page
   Timed-card showcase + case study modals.
   Runs after ../script.js (theme, nav, cursor, reveals live there).
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'projects') return;

  /* ─── CONTENT ───────────────────────────────────────────────
     Images and demos load from the live projects folder, so this page
     works wherever it is uploaded. To give ROSe a still image instead
     of its video loop, add  img: 'ROSethumb.png'  and remove vimeo.   */
  const ASSETS = 'https://tenneri.com/projects/';

  const SLIDES = [
    {
      kicker: 'Flagship · Brightspace',
      t1: 'ROSe', t2: 'Operating System',
      desc: "An operating system that lives inside Brightspace. Learners open apps, run tools and work through a company breach without leaving the course, and their work lands in the gradebook.",
      tag: 'SCORM · Gradebook sync',
      vimeo: '1169432149'
    },
    {
      kicker: 'Module · Live demo',
      t1: 'API', t2: 'Fundamentals',
      desc: "Nobody's first API call should hit a live endpoint. So the whole exchange is simulated on the page: real headers, real status codes and real failures, with nothing ever leaving the browser.",
      tag: 'Built for real learners',
      img: 'APIthumb.png',
      href: ASSETS + 'API/'
    },
    {
      kicker: 'Module · Live demo',
      t1: 'AI-Assisted', t2: 'Communication',
      desc: "Practical AI literacy instead of another slide deck about it. A live prompt sandbox, five tabs and a knowledge check, all on one page inside the LMS.",
      tag: 'Built for real learners',
      img: 'AIthumb.png',
      href: ASSETS + 'ai-communication/'
    },
    {
      kicker: 'Capstone · Live demo',
      t1: 'Stratos', t2: 'Cloud Console',
      desc: "Cloud, networking and security in one working console instead of three separate exercises: a live network on a US map, a Python pipeline to debug and a deployment spec to write.",
      tag: 'Built for real learners',
      img: 'Stratosthumb.png',
      href: ASSETS + 'stratos/'
    },
    {
      kicker: 'Employee training · Live demo',
      t1: 'Reef', t2: 'Guardian',
      desc: "Phishing training goes stale when the examples do. This one hands people a real-looking inbox: hover the links, check the senders, then report, junk or keep each email and see every red flag they missed.",
      tag: 'Used by employees',
      img: 'ReefGuardianthumb.png',
      href: ASSETS + 'ReefGuardian/'
    },
    {
      kicker: 'Employee training · Live demo',
      t1: 'Think Before', t2: 'You Post',
      desc: "Security awareness gets ignored when it never applies to you. A quick check-in at the start decides which tips you see, so every scenario is one you'd actually run into.",
      tag: 'Used by employees',
      img: 'Awarenessthumb.png',
      href: ASSETS + 'awareness/'
    },
    {
      kicker: 'Learning game · Live demo',
      t1: 'Lexicon', t2: 'Word Game',
      desc: "Vocabulary drills feel like a chore, so this one plays like a daily puzzle. Instructors load the words, learners get six guesses, and every attempt shows a definition, pronunciation and example.",
      tag: 'Built for real learners',
      img: 'Lexthumb.png',
      href: ASSETS + 'Lexicon/'
    }
  ];

  const CASES = [
    {
      badge: 'Cybersecurity',
      t1: 'SENTINEL', t2: 'SOC Training Simulation',
      short: "Analysts were learning incident response from readings. SENTINEL puts them in a simulated SOC with an alert queue, escalations and the time pressure of the real job.",
      img: 'Sentinelthumb.png',
      video: { webm: 'Sentinelvid.webm', mp4: 'Sentinelvid.mp4' },
      problem: "Analysts in a workforce program were learning cybersecurity response from readings and lectures, with no feel for what the job is like day to day. A real SOC platform for training means a vendor contract, per-seat costs and a security review at every renewal.",
      built: "A simulation that gives them that feel instead: a live alert queue, real escalation decisions and time pressure that feels genuine. It runs inside the LMS the program already had, with no vendor and no per-seat cost.",
      inside: [
        'Live alert queue with triage, severity classification and escalation logic',
        'Real-time network traffic chart with animated data and sliding UTC timestamps',
        'Threat category breakdown with detection coverage across six categories',
        'Analyst workload management with case redistribution and narrative team events',
        'Suspicious connection table, IOC confidence scoring and a critical asset panel',
        'Every layer connected: resolved cases, open alerts and analyst load move together'
      ],
      goal: "Give analysts the instincts of a real shift before their first one, in a build the program owns outright."
    },
    {
      badge: 'Business',
      t1: 'VENTURE', t2: 'Supply Chain Decision Lab',
      short: "A supplier goes dark and every sourcing decision ripples into the next one, live, while the costs climb.",
      img: 'Venturethumb.png',
      video: { mp4: 'Venturevid.mp4' },
      problem: "Business students read case studies about disruptions that happened to someone else's supply chain. They know the theory, but theory doesn't carry over to a decision made under pressure.",
      built: "VENTURE drops them into the disruption. A supplier goes dark, and every decision moves the cost tracker, the delivery window and the satisfaction score in real time, often before they fully understand why.",
      inside: [
        'Multi-stage disruption scenario with branching decisions that compound',
        'Live cost, timeline and customer satisfaction indicators reacting to every choice',
        'Alternative supplier negotiation with visible risk and cost trade-offs',
        'Debrief with an annotated decision review and industry benchmark comparison',
        "Instructor view of each student's decision path and outcome"
      ],
      goal: "Let students feel what a bad sourcing call costs before they make one with a real client's money."
    },
    {
      badge: 'Marketing',
      t1: 'CAMPAIGN', t2: 'Marketing Decision Lab',
      short: "A brief, a budget and a market that responds. Overspend on one channel or miss the audience and the numbers tell you right away.",
      img: 'Campaignthumb.png',
      video: { mp4: 'Campaignvid.mp4' },
      problem: "Marketing students write plans that never run and campaigns that never fail. They learn the vocabulary of performance marketing without ever watching an audience ignore them.",
      built: "CAMPAIGN gives them a client brief, a budget and a market that reacts. Pile too much into one channel and returns flatten out. Miss the demographic and conversions stall. The feedback is immediate and the debrief is built in.",
      inside: [
        'Client brief with a defined product, audience profile and campaign objective',
        'Budget allocation across social, search, display and influencer channels',
        'Audience response engine reacting to targeting and spend decisions',
        'Live dashboard showing reach, engagement and conversion week by week',
        'Post-campaign analysis with an optimized scenario for comparison',
        "Instructor view of each student's allocation strategy and outcome"
      ],
      goal: "Send students into their first real campaign already knowing what failure looks like, and why it happens."
    },
    {
      badge: 'Research ethics',
      t1: 'IRB', t2: 'Ethics Review Lab',
      short: "Students review research proposals the way a real board would, and find the ethical lines before they cross one with their own work.",
      img: 'IRBthumb.png',
      video: { mp4: 'IRBvid.mp4' },
      problem: "Research ethics is usually taught through case studies of violations from decades ago. Students get the principles in the abstract, then find out where the lines are when their own proposal comes back flagged.",
      built: "The lab puts them on the review side first. They work through research scenarios, flag concerns, make recommendations and see what each call leads to, while the stakes are still a grade.",
      inside: [
        'Scenario library covering informed consent, participant risk, data privacy and deception',
        'Review workflow that mirrors a real IRB: flag, assess, recommend, approve or reject',
        "Consequence mapping showing how each decision affects the study's ethics standing",
        'Reflection prompts tied to the Belmont Report and APA guidelines',
        'Scored completion synced to the course gradebook'
      ],
      goal: "Let students make their ethics mistakes in the lab instead of in the field."
    },
    {
      badge: 'Compliance · GRC',
      t1: 'THRESHOLD', t2: 'Compliance Training Lab',
      short: "Realistic workplace calls where the wrong choice plays out as a detailed chain of consequences, so the rules finally make sense.",
      img: 'Thresholdthumb.png',
      video: { vimeo: '1191231377' },
      problem: "Most employees have done the same compliance training several times and remember almost none of it. Rules without consequences get read like terms and conditions: click, accept, move on.",
      built: "THRESHOLD asks people to understand why the rules exist instead of memorizing them. Each scenario is a realistic workplace situation, and a wrong call sets off a visible chain of regulatory and financial consequences.",
      inside: [
        'GRC scenarios drawn from data breach, reporting and escalation situations',
        'A consequence timeline that builds itself after each decision',
        'Decision mapping across GDPR, SOC 2 and ISO 27001 where relevant',
        'A reading timer on consequence panels so the outcome cannot be skipped',
        'Completion records synced to compliance tracking'
      ],
      goal: "Make people want to know what happens next. That's the hook most compliance training never has."
    }
  ];

  /* ─── HELPERS ─── */
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clampN = (v, a, b) => Math.min(Math.max(v, a), b);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL = 7;        // seconds each slide stays up
  const MOVE = 1.0;       // seconds for the card expand

  /* ═══════════════ MODAL ═══════════════ */
  const modal = $('pj-modal');
  const mKicker = $('pj-modal-kicker');
  const mTitle = $('pj-modal-title');
  const mVideo = $('pj-modal-video');
  const mBody = $('pj-modal-body');
  const mClose = $('pj-modal-close');
  let lastFocus = null;
  let onModalChange = () => {};

  function videoMarkup(v, title) {
    if (v.vimeo) {
      return `<iframe src="https://player.vimeo.com/video/${v.vimeo}?badge=0&autopause=0&autoplay=1&muted=0&loop=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" title="${esc(title)}"></iframe>`;
    }
    let src = '';
    if (v.webm) src += `<source src="${ASSETS + v.webm}" type="video/webm">`;
    if (v.mp4) src += `<source src="${ASSETS + v.mp4}" type="video/mp4">`;
    return `<video autoplay muted loop playsinline controls>${src}</video>`;
  }

  function openModal({ kicker, t1, t2, video, body }) {
    lastFocus = document.activeElement;
    mKicker.textContent = kicker || '';
    mTitle.innerHTML = `${esc(t1)}: <em>${esc(t2)}</em>`;
    mVideo.innerHTML = video ? videoMarkup(video, `${t1} ${t2}`) : '';
    mVideo.style.display = video ? '' : 'none';
    mBody.innerHTML = body || '';
    modal.classList.add('open');
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (!reduceMotion) gsap.fromTo('.pj-modal-box', { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' });
    mClose.focus();
    onModalChange(true);
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    mVideo.innerHTML = '';
    document.body.style.overflow = '';
    onModalChange(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  mClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function caseBody(c) {
    return `
      <div class="pj-modal-cols">
        <div><span class="pj-modal-label">The problem</span><p class="pj-modal-text">${esc(c.problem)}</p></div>
        <div><span class="pj-modal-label">What I built</span><p class="pj-modal-text">${esc(c.built)}</p></div>
      </div>
      <span class="pj-modal-label">Inside it</span>
      <ul class="pj-modal-list">${c.inside.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <div class="pj-modal-goal"><span class="pj-modal-label">The goal</span><p>${esc(c.goal)}</p></div>`;
  }

  /* ═══════════════ CASE STUDY GRID ═══════════════ */
  const grid = $('pj-grid');
  if (grid) {
    CASES.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pj-case reveal';
      b.setAttribute('aria-label', `Watch ${c.t1}: ${c.t2}`);
      b.innerHTML = `
        <div class="pj-case-thumb">
          <span class="pj-case-badge">${esc(c.badge)}</span>
          <div class="pj-case-thumb-img" style="background-image:url('${ASSETS + c.img}')"></div>
          <div class="pj-case-play" aria-hidden="true"><span>▶</span></div>
        </div>
        <div class="pj-case-body">
          <h3 class="pj-case-title">${esc(c.t1)}: <em>${esc(c.t2)}</em></h3>
          <p class="pj-case-desc">${esc(c.short)}</p>
          <div class="pj-case-foot"><span>Watch walkthrough</span><span>→</span></div>
        </div>`;
      b.addEventListener('click', () => openModal({ kicker: c.badge, t1: c.t1, t2: c.t2, video: c.video, body: caseBody(c) }));
      grid.appendChild(b);
    });
  }

  /* ═══════════════ SHOWCASE ═══════════════ */
  const show = $('pj-show');
  if (!show) return;

  const cardsWrap = $('pj-cards');
  const details = $('pj-details');
  const kick = $('pj-kicker');
  const t1 = $('pj-t1');
  const t2 = $('pj-t2');
  const desc = $('pj-desc');
  const cta = $('pj-cta');
  const openBtn = $('pj-open');
  const tag = $('pj-tag');
  const pager = $('pj-pager');
  const fillBar = $('pj-fill');
  const num = $('pj-num');
  const pauseBtn = $('pj-pause');
  const timerEl = $('pj-timer');
  const cover = $('pj-cover');
  const scrollHint = $('pj-scroll-hint');
  const N = SLIDES.length;
  $('pj-total').textContent = '/ ' + String(N).padStart(2, '0');

  // Build the cards
  const cards = SLIDES.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pj-card';
    b.setAttribute('aria-label', `Show ${s.t1} ${s.t2}`);
    const media = s.vimeo
      ? `<div class="pj-card-media"><div class="pj-card-shot"><iframe src="https://player.vimeo.com/video/${s.vimeo}?background=1&autoplay=1&muted=1&loop=1&autopause=0" title="${esc(s.t1)} preview" allow="autoplay; fullscreen" tabindex="-1" aria-hidden="true"></iframe></div></div>`
      : `<div class="pj-card-media"><div class="pj-card-shot" style="background-image:url('${ASSETS + s.img}')"></div></div>`;
    b.innerHTML = media + `
      <div class="pj-card-shade"></div>
      <div class="pj-card-label">
        <span class="pj-card-bar"></span>
        <span class="pj-card-kicker">${esc(s.kicker.split(' · ')[0])}</span>
        <span class="pj-card-title">${esc(s.t1)} <em>${esc(s.t2)}</em></span>
      </div>`;
    b.addEventListener('click', () => goTo(i, true));
    cardsWrap.appendChild(b);
    return b;
  });

  let order = SLIDES.map((_, i) => i);
  let busy = false;
  let m = null;
  let timer = null;

  /* Geometry, measured from the showcase itself */
  function metrics() {
    const W = show.clientWidth, H = show.clientHeight;
    const mobile = W < 820;
    // Landscape cards (16:10) so a whole screenshot fits inside each one
    const cw = Math.round(clampN(Math.min(H * 0.36, W * 0.18), 210, 340));
    const ch = Math.round(cw * 0.625);
    const gap = Math.round(cw * 0.08);
    const left = Math.round(Math.max(W * 0.55, W - (cw + gap) * 2.7));
    const top = Math.round(H - ch - Math.max(110, H * 0.15));
    return { W, H, mobile, cw, ch, gap, left, top };
  }
  const full = () => ({ x: 0, y: 0, width: m.W, height: m.H, borderRadius: 0 });
  const shotOf = c => c.querySelector('.pj-card-shot');
  // Screenshot frame inside the full slide: 80% wide, right of the text
  function shotFull() {
    if (m.mobile) return { left: 0, top: 0, width: m.W, height: m.H };
    const w = Math.min(m.W * 0.8, m.H * 1.6), h = Math.min(m.W * 0.45, m.H * 0.9);
    return { left: m.W - w, top: m.H * 0.54 - h / 2, width: w, height: h };
  }
  // Screenshot frame inside a small card: fills it
  function shotSlot() {
    return m.mobile ? { left: 0, top: 0, width: m.W, height: m.H } : { left: 0, top: 0, width: m.cw, height: m.ch };
  }
  function slot(k) {
    if (m.mobile) return { x: m.W + 24, y: 0, width: m.W, height: m.H, borderRadius: 0 };
    return { x: m.left + (k - 1) * (m.cw + m.gap), y: m.top, width: m.cw, height: m.ch, borderRadius: 14 };
  }

  function setActiveVisual(card, on, animate) {
    card.classList.toggle('is-active', on);
    card.tabIndex = on ? -1 : 0;
    const shade = card.querySelector('.pj-card-shade');
    const label = card.querySelector('.pj-card-label');
    gsap.to(shade, { opacity: on ? 1 : 0, duration: animate && !reduceMotion ? 0.7 : 0, overwrite: true });
    gsap.to(label, { opacity: on ? 0 : 1, y: on ? 14 : 0, duration: animate && !reduceMotion ? 0.35 : 0, overwrite: true });
  }

  function placeChrome() {
    if (m.mobile) {
      details.style.top = '';
      gsap.set(pager, { left: m.W - pager.offsetWidth - 20, top: m.H - pager.offsetHeight - 30 });
    } else {
      // Center the details in the space under the nav, never behind it
      const h = details.offsetHeight;
      details.style.top = Math.max(110, Math.round((m.H - h) / 2) + 10) + 'px';
      gsap.set(pager, { left: m.left, top: m.top + m.ch + 26 });
    }
  }

  function layout() {
    m = metrics();
    order.forEach((ci, k) => {
      const c = cards[ci];
      gsap.killTweensOf(c);
      gsap.set(c, Object.assign(k === 0 ? full() : slot(k), { scale: 1, opacity: 1, zIndex: k === 0 ? 5 : 30 }));
      setActiveVisual(c, k === 0, false);
      c.classList.toggle('is-full', k === 0);
      gsap.killTweensOf(shotOf(c));
      gsap.set(shotOf(c), k === 0 ? shotFull() : shotSlot());
    });
    placeChrome();
  }

  function fill(s) {
    kick.textContent = s.kicker;
    t1.textContent = s.t1;
    t2.textContent = s.t2;
    desc.textContent = s.desc;
    tag.textContent = s.tag || '';
    if (s.href) {
      openBtn.href = s.href;
      openBtn.target = '_blank';
      openBtn.rel = 'noopener';
      openBtn.textContent = 'Open demo →';
      openBtn.removeAttribute('role');
    } else {
      openBtn.href = '#';
      openBtn.removeAttribute('target');
      openBtn.setAttribute('role', 'button');
      openBtn.textContent = 'Watch it run →';
    }
  }
  openBtn.addEventListener('click', e => {
    const s = SLIDES[order[0]];
    if (s.href) return;
    e.preventDefault();
    openModal({ kicker: s.kicker, t1: s.t1, t2: s.t2, video: { vimeo: s.vimeo } });
  });

  function swapDetails(s) {
    if (reduceMotion) { fill(s); return; }
    const lines = [kick, t1, t2];
    gsap.timeline()
      .to(lines, { yPercent: -110, duration: 0.38, ease: 'power2.in', stagger: 0.04 })
      .to([desc, cta], { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' }, 0)
      .add(() => fill(s))
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
      .fromTo([desc, cta], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, '-=0.55');
  }

  function setCount(animate) {
    const i = order[0];
    const label = String(i + 1).padStart(2, '0');
    gsap.to(fillBar, { scaleX: (i + 1) / N, duration: animate && !reduceMotion ? 0.8 : 0, ease: 'power3.inOut' });
    if (!animate || reduceMotion) { num.textContent = label; return; }
    gsap.timeline()
      .to(num, { yPercent: -100, duration: 0.3, ease: 'power2.in' })
      .add(() => { num.textContent = label; })
      .fromTo(num, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' });
  }

  /* The move: the chosen card grows to fill the screen, the rest slide
     into their new slots, and the old feature tucks in at its new place. */
  function goTo(target, byUser) {
    if (busy || target === order[0]) return;
    busy = true;
    stopTimer();
    if (byUser) details.setAttribute('aria-live', 'polite');

    const old = order[0];
    const p = order.indexOf(target);
    order = order.slice(p).concat(order.slice(0, p));
    m = metrics();

    const D = reduceMotion ? 0 : MOVE;
    const E = 'power3.inOut';
    const nc = cards[target];
    const oc = cards[old];

    gsap.set(oc, { zIndex: 4 });
    gsap.set(nc, { zIndex: 40 });
    setActiveVisual(nc, true, true);
    oc.classList.remove('is-active');
    oc.classList.remove('is-full');
    nc.classList.add('is-full');
    // The screenshot travels to its final frame in the same motion as the card
    gsap.to(shotOf(nc), Object.assign(shotFull(), { duration: D, ease: E, overwrite: true }));

    gsap.to(nc, Object.assign(full(), {
      duration: D, ease: E,
      onComplete: () => {
        gsap.set(nc, { zIndex: 5 });
        const s = slot(order.indexOf(old));
        gsap.set(oc, Object.assign({}, s, { scale: 1, zIndex: 30, opacity: 0, y: s.y + 36 }));
        gsap.set(shotOf(oc), shotSlot());
        setActiveVisual(oc, false, false);
        gsap.to(oc, { opacity: 1, y: s.y, duration: reduceMotion ? 0 : 0.55, ease: 'power3.out' });
        busy = false;
        startTimer();
      }
    }));

    order.forEach((ci, k) => {
      if (k === 0 || ci === old) return;
      gsap.set(cards[ci], { zIndex: 30 });
      gsap.to(cards[ci], Object.assign(slot(k), { scale: 1, duration: D * 0.85, ease: E, delay: reduceMotion ? 0 : 0.06 * k }));
    });

    swapDetails(SLIDES[target]);
    setCount(true);
  }
  const next = byUser => goTo(order[1], byUser);
  const prev = byUser => goTo(order[order.length - 1], byUser);
  $('pj-next').addEventListener('click', () => next(true));
  $('pj-prev').addEventListener('click', () => prev(true));

  /* ─── Autoplay with reasons to hold ─── */
  const holds = new Set();
  function startTimer() {
    if (timer) timer.kill();
    timer = null;
    if (reduceMotion) return;
    timer = gsap.fromTo(timerEl, { scaleX: 0 }, { scaleX: 1, duration: DWELL, ease: 'none', onComplete: () => next(false) });
    if (holds.size) timer.pause();
  }
  function stopTimer() {
    if (timer) timer.kill();
    timer = null;
    gsap.to(timerEl, { scaleX: 0, duration: 0.3, ease: 'power2.out' });
  }
  function hold(reason) { holds.add(reason); if (timer) timer.pause(); }
  function release(reason) { holds.delete(reason); if (!holds.size && timer) timer.resume(); }

  pauseBtn.addEventListener('click', () => {
    const paused = pauseBtn.getAttribute('aria-pressed') === 'true';
    pauseBtn.setAttribute('aria-pressed', String(!paused));
    pauseBtn.setAttribute('aria-label', paused ? 'Pause autoplay' : 'Resume autoplay');
    paused ? release('user') : hold('user');
  });

  // Pause while someone is reading or reaching for something
  show.addEventListener('pointerover', e => {
    if (e.target.closest('.pj-details, .pj-pager, .pj-card:not(.is-active)')) hold('hover');
    else release('hover');
  });
  show.addEventListener('pointerleave', () => release('hover'));
  // Only keyboard focus pauses; a mouse click on an arrow should not stop autoplay for good
  show.addEventListener('focusin', e => {
    let kb = false;
    try { kb = e.target.matches(':focus-visible'); } catch (err) { kb = false; }
    if (kb) hold('focus');
  });
  show.addEventListener('focusout', e => { if (!show.contains(e.relatedTarget)) release('focus'); });
  onModalChange = open => (open ? hold('modal') : release('modal'));
  document.addEventListener('visibilitychange', () => (document.hidden ? hold('tab') : release('tab')));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? release('offscreen') : hold('offscreen');
    }, { threshold: 0.35 }).observe(show);
  }

  // Keyboard arrows while the showcase is on screen
  document.addEventListener('keydown', e => {
    if (modal.classList.contains('open') || holds.has('offscreen')) return;
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(true); }
  });

  // Swipe on phones
  let touchX = null;
  show.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) (dx < 0 ? next(true) : prev(true));
  }, { passive: true });

  // Re-measure on resize
  let rz = null;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (!busy) layout(); }, 150);
  });

  /* ─── Scroll hint: bobs gently, fades as the page scrolls ─── */
  if (scrollHint) {
    if (!reduceMotion) {
      gsap.to(scrollHint, { y: 7, repeat: -1, yoyo: true, duration: 1.3, ease: 'sine.inOut' });
    }
    const fadeHint = () => {
      const o = Math.max(0, 1 - window.scrollY / 220);
      scrollHint.style.opacity = o;
      scrollHint.style.pointerEvents = o < 0.1 ? 'none' : '';
    };
    window.addEventListener('scroll', fadeHint, { passive: true });
    scrollHint.addEventListener('click', e => {
      e.preventDefault();
      const target = $('more-work');
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ─── Intro: gold curtain pulls away, cards slide in ─── */
  function intro() {
    fill(SLIDES[order[0]]);
    layout();
    setCount(false);
    if (reduceMotion) { cover.remove(); return; }

    gsap.set([kick, t1, t2], { yPercent: 110 });
    gsap.set([desc, cta], { opacity: 0, y: 16 });
    gsap.set(pager, { opacity: 0, y: 20 });
    if (scrollHint) gsap.set(scrollHint, { opacity: 0 });
    const rest = order.slice(1).map(ci => cards[ci]);
    if (!m.mobile) gsap.set(rest, { x: '+=' + Math.round(m.W * 0.45) });

    gsap.timeline({ onComplete: startTimer })
      .to(cover, { xPercent: 101, duration: 0.95, ease: 'power3.inOut', delay: 0.1 })
      .from(cards[order[0]], { scale: 1.16, duration: 1.6, ease: 'power3.out' }, '-=0.65')
      .to(rest, { x: (i) => slot(i + 1).x, duration: 1.15, ease: 'power3.out', stagger: 0.07 }, '<0.1')
      .to([kick, t1, t2], { yPercent: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09 }, '<0.25')
      .to([desc, cta], { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.6')
      .to(pager, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .to(scrollHint, { opacity: Math.max(0, 1 - window.scrollY / 220), duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .add(() => cover.remove());
  }

  // Wait for fonts so the title widths are right before measuring
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(intro);
  } else {
    intro();
  }
})();
