/**
 * PHOENIX MOBILES & SERVICES — main.js
 * Extravagant cinematic experience: gold particles, GSAP ScrollTrigger,
 * magnetic buttons, split-text reveals, canvas particle systems.
 */
'use strict';

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth <= 768;
const isTouch = () => window.matchMedia('(hover: none)').matches;

/* ══════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════ */
function initScrollBar() {
  const bar = $('#scrollBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : '0%';
  }, { passive: true });
}

/* ══════════════════════════════════════
   PRELOADER
══════════════════════════════════════ */
function initPreloader() {
  const pl = $('#preloader');
  if (!pl) return;

  const MIN = 2400;
  const t0 = Date.now();

  function done() {
    pl.classList.add('exit');
    setTimeout(() => {
      pl.style.display = 'none';
      document.body.classList.remove('loading');
      afterPreload();
    }, 1000);
  }

  window.addEventListener('load', () => {
    const wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(done, wait);
  });
  // Safety fallback
  setTimeout(done, MIN + 1000);
}

/* ══════════════════════════════════════
   POST-PRELOAD SETUP
══════════════════════════════════════ */
function afterPreload() {
  initGSAP();
  initCounters($('.hero-stats'));
  initCounters($('.stats-band'));
  animateHeroIn();
}

/* ══════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════ */
function initCursor() {
  if (prefersReduced() || isTouch()) return;
  const wrap = $('#cursor');
  const core = wrap && wrap.querySelector('.cursor-core');
  const ring = wrap && wrap.querySelector('.cursor-ring');
  if (!wrap) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (core) {
      core.style.left = mx + 'px';
      core.style.top  = my + 'px';
    }
  });

  const interactors = 'a, button, [data-magnetic], input, select, textarea, .srv-card, .why-card, .dev-tile';
  document.addEventListener('mouseover', e => { if (e.target.closest(interactors)) wrap.classList.add('hovered'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(interactors)) wrap.classList.remove('hovered'); });
  document.addEventListener('mousedown', () => wrap.classList.add('clicking'));
  document.addEventListener('mouseup',   () => wrap.classList.remove('clicking'));

  if (ring) {
    (function animateRing() {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animateRing);
    })();
  }
}

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
function initNav() {
  const header  = $('#header');
  const burger  = $('#navBurger');
  const menu    = $('#navMenu');
  const links   = $$('.nav-link');

  if (!header) return;

  // Scrolled state
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
    updateActiveLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open.toString());
      document.body.classList.toggle('menu-open', open);
    });
    $$('a', menu).forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
    });
  }

  function updateActiveLink() {
    const scrollY = window.scrollY + 120;
    const sections = $$('section[id]');
    let active = null;
    sections.forEach(s => { if (scrollY >= s.offsetTop) active = s.id; });
    links.forEach(a => {
      const id = (a.getAttribute('href') || '').replace('#', '');
      a.classList.toggle('active', id === active);
    });
  }
}

/* ══════════════════════════════════════
   MAGNETIC BUTTONS
══════════════════════════════════════ */
function initMagnetic() {
  if (isTouch() || prefersReduced()) return;
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const strength = el.classList.contains('btn-xl') ? 12 : 8;
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = '';
      setTimeout(() => el.style.transition = '', 500);
    });
    el.addEventListener('mouseenter', () => {
      el.style.transition = 'transform 0.15s ease';
    });
  });
}

/* ══════════════════════════════════════
   HERO CANVAS — Gold Particle Vortex
   (Animation: Particle Morph / Wing Formation)
══════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas || prefersReduced()) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], tick = 0;

  const GOLD_COLORS = ['#FFD700','#D4AF37','#FFC107','#FFFDE7','#FFAB00','#8B6914','#B8860B'];

  class Particle {
    constructor(i, total) {
      this.reset(i, total);
    }
    reset(i, total) {
      // Orbit in left and right wing arcs to form a phoenix wing silhouette
      const t = i / total;
      const side = i % 2 === 0 ? -1 : 1;  // left / right wing
      const wingT = (i % Math.ceil(total / 2)) / Math.ceil(total / 2);
      // Wing curve: arc spreading outward and curving down like a wing
      const angle  = (Math.PI * 0.15) + wingT * (Math.PI * 0.55);
      const radius = (60 + wingT * 180) * (W / 1440);

      this.tx = 0.5 + side * (Math.cos(angle) * radius / W);
      this.ty = 0.44 - Math.sin(angle) * (radius * 0.55) / H;

      // Some tail particles below center
      if (wingT > 0.75) {
        this.ty = 0.5 + (wingT - 0.75) * 0.8;
        this.tx = 0.5 + side * 0.04 * Math.sin(wingT * Math.PI * 4);
      }

      this.x = rnd(0.2, 0.8) * W;
      this.y = rnd(0.2, 0.8) * H;
      this.vx = 0; this.vy = 0;
      this.size = rnd(1.5, 4.5);
      this.color = GOLD_COLORS[rndInt(0, GOLD_COLORS.length - 1)];
      this.alpha = rnd(0.4, 0.95);
      this.speed = rnd(0.025, 0.055);
      this.phase = rnd(0, Math.PI * 2);
      this.wobble = rnd(0.003, 0.01);
    }
    update(t) {
      const tx = this.tx * W;
      const ty = this.ty * H;
      // Attraction to target position
      this.vx += (tx - this.x) * this.speed;
      this.vy += (ty - this.y) * this.speed;
      // Turbulence / orbital drift
      const orbit = Math.sin(t * 0.0008 + this.phase) * 1.5;
      this.vx += orbit;
      this.vy += Math.cos(t * 0.0006 + this.phase) * 1.2;
      // Damping
      this.vx *= 0.88; this.vy *= 0.88;
      this.x += this.vx; this.y += this.vy;
      // Alpha flicker
      this.alpha = clamp(this.alpha + Math.sin(t * 0.003 + this.phase) * 0.015, 0.2, 1);
    }
    draw(ctx) {
      const r = this.size * 3;
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      grd.addColorStop(0,   hexAlpha(this.color, this.alpha));
      grd.addColorStop(0.4, hexAlpha(this.color, this.alpha * 0.5));
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1,3),16),
          g = parseInt(hex.slice(3,5),16),
          b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticles();
  }

  function buildParticles() {
    const count = isMobile() ? 100 : Math.min(280, Math.floor(W / 5));
    particles = Array.from({ length: count }, (_, i) => new Particle(i, count));
  }

  let raf;
  function draw(ts) {
    raf = requestAnimationFrame(draw);
    tick++;
    ctx.clearRect(0, 0, W, H);

    // Background radial glow (the "aura" behind the logo)
    const cx = W * 0.5, cy = H * 0.44;
    const pulse = 0.5 + Math.sin(ts * 0.0007) * 0.15;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
    grd.addColorStop(0,   `rgba(212,175,55,${0.06 * pulse})`);
    grd.addColorStop(0.5, `rgba(180,140,30,${0.03 * pulse})`);
    grd.addColorStop(1,    'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(ts); p.draw(ctx); });

    // Intermittent shockwave burst every ~12s
    if (tick % 720 === 0 && !isMobile()) shockwaveBurst(cx, cy);
  }

  // Gold shockwave ring that expands outward (Animation: Shockwave)
  let shockwaves = [];
  function shockwaveBurst(cx, cy) {
    shockwaves.push({ x: cx, y: cy, r: 10, alpha: 0.8, growing: true });
  }
  const origDraw = draw;

  function drawWithShockwaves(ts) {
    raf = requestAnimationFrame(drawWithShockwaves);
    tick++;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.44;
    const pulse = 0.5 + Math.sin(ts * 0.0007) * 0.15;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
    grd.addColorStop(0,   `rgba(212,175,55,${0.06 * pulse})`);
    grd.addColorStop(0.5, `rgba(180,140,30,${0.03 * pulse})`);
    grd.addColorStop(1,    'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(ts); p.draw(ctx); });

    // Shockwaves
    shockwaves = shockwaves.filter(s => s.alpha > 0.01);
    shockwaves.forEach(s => {
      s.r += 4; s.alpha *= 0.96;
      ctx.save();
      ctx.strokeStyle = `rgba(212,175,55,${s.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(255,215,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    if (tick % 720 === 0 && !isMobile()) shockwaveBurst(cx, cy);
  }

  resize();
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); }, { passive: true });
  requestAnimationFrame(drawWithShockwaves);
}

/* ══════════════════════════════════════
   HERO STAR FIELD
══════════════════════════════════════ */
function initStarField() {
  const field = $('#heroStars');
  if (!field || prefersReduced()) return;
  const count = isMobile() ? 30 : 70;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star-dot';
    const size = rnd(1, 3);
    star.style.cssText = `
      width:${size}px;height:${size}px;
      top:${rnd(5, 95)}%;left:${rnd(2, 98)}%;
      animation-duration:${rnd(2, 6)}s;
      animation-delay:${rnd(0, 6)}s;
    `;
    field.appendChild(star);
  }
}

/* ══════════════════════════════════════
   HERO ANIMATE IN (with or without GSAP)
══════════════════════════════════════ */
function animateHeroIn() {
  // Wrap headline words for animation
  $$('.hh-word').forEach(word => {
    const text = word.textContent;
    word.textContent = '';
    const inner = document.createElement('span');
    inner.className = 'hh-word-inner';
    inner.textContent = text;
    word.appendChild(inner);
  });

  const logoWrap = $('#heroLogoWrap');
  const heroText = $('#heroText');
  const heroStats = $('#heroStats');

  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.fromTo(logoWrap,
      { opacity: 0, scale: 0.7, filter: 'blur(20px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2 }
    )
    .fromTo('#heroEyebrow',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 }, '-=0.4'
    )
    .fromTo('.hh-word-inner',
      { y: '110%', rotateX: -80 },
      { y: '0%', rotateX: 0, duration: 0.85, stagger: 0.18, transformOrigin: '50% 100%' }, '-=0.3'
    )
    .fromTo('#heroSub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 }, '-=0.2'
    )
    .fromTo('#heroActions',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 }, '-=0.2'
    )
    .to(heroText, { opacity: 1, duration: 0 }, 0);

    setTimeout(() => {
      if (heroStats) heroStats.classList.add('revealed');
    }, 1800);

  } else {
    // Fallback: CSS transitions
    if (logoWrap) { logoWrap.style.transition = 'opacity 1s ease, transform 1s ease'; logoWrap.style.opacity = '1'; }
    if (heroText)  { heroText.style.transition = 'opacity 0.8s 0.5s ease'; heroText.style.opacity = '1'; }
    $$('.hh-word-inner').forEach((el, i) => {
      el.style.transition = `transform 0.8s ${0.5 + i * 0.15}s ease`;
      el.style.transform = 'translateY(0)';
    });
    if (heroStats) setTimeout(() => heroStats.classList.add('revealed'), 1600);
  }
}

/* ══════════════════════════════════════
   GSAP SCROLL TRIGGER ANIMATIONS
══════════════════════════════════════ */
function initGSAP() {
  if (typeof gsap === 'undefined' || prefersReduced()) {
    initFallbackReveal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Section labels, titles, subs
  $$('.section-label, .section-title, .section-sub, [data-reveal]').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Service cards — staggered 3D drop
  gsap.fromTo('.srv-card',
    { opacity: 0, y: 60, scale: 0.95, rotateX: -8 },
    {
      opacity: 1, y: 0, scale: 1, rotateX: 0,
      duration: 0.75, stagger: 0.1, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.services-grid', start: 'top 82%', once: true }
    }
  );

  // Why cards
  gsap.fromTo('.why-card',
    { opacity: 0, y: 50, scale: 0.94 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 0.65, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '.why-grid', start: 'top 82%', once: true }
    }
  );

  // Stats band
  gsap.fromTo('.stats-band',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats-band', start: 'top 85%', once: true,
        onEnter: () => initCounters($('.stats-band'))
      }
    }
  );

  // Process steps stagger
  $$('.proc-step').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: -50 },
      {
        opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true,
          onEnter: () => el.classList.add('revealed')
        }
      }
    );
  });

  // Device tiles with scale bounce
  gsap.fromTo('.dev-tile',
    { opacity: 0, y: 50, scale: 0.9 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 0.65, stagger: 0.1, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: '.devices-grid', start: 'top 82%', once: true }
    }
  );

  // Sales grid split reveal
  gsap.fromTo('.sales-text',
    { opacity: 0, x: -70 },
    {
      opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: '.sales-grid', start: 'top 80%', once: true }
    }
  );
  gsap.fromTo('.sales-visual',
    { opacity: 0, x: 70 },
    {
      opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: '.sales-grid', start: 'top 80%', once: true }
    }
  );

  // About split
  gsap.fromTo('.about-text',
    { opacity: 0, x: -70 },
    {
      opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-grid', start: 'top 80%', once: true }
    }
  );
  gsap.fromTo('.ac-1, .ac-2, .ac-3',
    { opacity: 0, x: 60 },
    {
      opacity: 1, x: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-cards', start: 'top 82%', once: true }
    }
  );

  // Contact split
  gsap.fromTo('.contact-details',
    { opacity: 0, x: -60 },
    {
      opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-grid', start: 'top 82%', once: true }
    }
  );
  gsap.fromTo('.contact-map',
    { opacity: 0, x: 60 },
    {
      opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-grid', start: 'top 82%', once: true }
    }
  );

  // CTA logo
  gsap.fromTo('.cta-logo-wrap',
    { opacity: 0, y: 40, scale: 0.85 },
    {
      opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '#cta', start: 'top 80%', once: true }
    }
  );

  // Gallery header
  gsap.fromTo('.gallery-header .section-title, .gallery-header .section-eyebrow',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1,
      scrollTrigger: { trigger: '.gallery-header', start: 'top 85%', once: true }
    }
  );

  initGalleryHorizontal();
  initProcessLine();
  initCardTilt();
  initServiceParticles();
  initCounters($('#why-us'));
}

/* ══════════════════════════════════════
   FALLBACK REVEAL (no GSAP)
══════════════════════════════════════ */
function initFallbackReveal() {
  const allReveal = $$(
    '.section-label, .section-title, .section-sub, [data-reveal], .srv-card, ' +
    '.why-card, .dev-tile, .proc-step, .stats-band, .sales-text, .sales-visual, ' +
    '.about-text, .ac-1, .ac-2, .ac-3, .contact-details, .contact-map, .cta-logo-wrap'
  );
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const delay = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => {
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('revealed');
      }, delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  allReveal.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    obs.observe(el);
  });

  initProcessLine();
  initCounters($('.stats-band'));
  initCounters($('#why-us'));
  initGalleryHorizontalSimple();
}

/* ══════════════════════════════════════
   ANIMATED NUMBER COUNTERS
══════════════════════════════════════ */
function initCounters(scope) {
  if (!scope) return;
  const nums = $$('[data-count]', scope);
  if (!nums.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const dur = 2000;
      const start = performance.now();
      function tick(now) {
        const p = clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════
   PROCESS LINE — Animated SVG path draw
══════════════════════════════════════ */
function initProcessLine() {
  const rail  = $('#processRail');
  const path  = $('#processPath');
  const steps = $$('.proc-step');
  if (!rail || !path) return;

  function update() {
    const rect = rail.getBoundingClientRect();
    const viewH = window.innerHeight;
    const progress = clamp(
      map(-rect.top, -rect.height * 0.05, rect.height * 0.8, 0, 1),
      0, 1
    );
    const total = parseFloat(path.getAttribute('stroke-dasharray') || 800);
    path.style.strokeDashoffset = total * (1 - progress);

    steps.forEach((step, i) => {
      step.classList.toggle('active', progress >= i / steps.length);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ══════════════════════════════════════
   HORIZONTAL GALLERY (GSAP ScrollTrigger)
══════════════════════════════════════ */
function initGalleryHorizontal() {
  if (typeof ScrollTrigger === 'undefined') { initGalleryHorizontalSimple(); return; }
  if (window.innerWidth <= 768) { initGalleryHorizontalSimple(); return; }

  const outer = $('#galleryOuter');
  const track = $('#galleryTrack');
  if (!outer || !track) return;

  const maxShift = track.scrollWidth - track.offsetWidth - 80;

  gsap.to(track, {
    x: -maxShift,
    ease: 'none',
    scrollTrigger: {
      trigger: outer,
      start: 'top top',
      end: `+=${outer.offsetHeight - window.innerHeight}`,
      pin: '.gallery-sticky',
      scrub: 1.2,
      invalidateOnRefresh: true,
    }
  });
}

function initGalleryHorizontalSimple() {
  // Mobile: just let it be native horizontal scroll, no JS needed
}

/* ══════════════════════════════════════
   CARD TILT (3D perspective on hover)
══════════════════════════════════════ */
function initCardTilt() {
  if (isTouch() || prefersReduced()) return;

  const cards = $$('.srv-card, .why-card, .gl-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) / (r.width  / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const maxT = 7;
      card.style.transform = `perspective(900px) rotateY(${dx * maxT}deg) rotateX(${-dy * maxT}deg) translateY(-8px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      card.style.transform = '';
      setTimeout(() => card.style.transition = '', 600);
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.2s ease';
    });
  });
}

/* ══════════════════════════════════════
   SERVICE CARD PARTICLE SPARKS ON HOVER
══════════════════════════════════════ */
function initServiceParticles() {
  if (isTouch() || prefersReduced()) return;

  $$('.srv-card').forEach(card => {
    const container = card.querySelector('.srv-particles');
    if (!container) return;

    card.addEventListener('mouseenter', () => {
      for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'srv-particle';
        const angle = rnd(0, Math.PI * 2);
        const dist  = rnd(40, 120);
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        p.style.setProperty('--dur', `${rnd(0.5, 1)}s`);
        p.style.left = `${rnd(30, 70)}%`;
        p.style.top  = `${rnd(30, 70)}%`;
        p.style.animationDelay = `${rnd(0, 0.2)}s`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    });
  });
}

/* ══════════════════════════════════════
   CTA CANVAS — Dense Gold Particle Fire
══════════════════════════════════════ */
function initCtaCanvas() {
  const canvas = $('#ctaCanvas');
  if (!canvas || prefersReduced()) return;
  const ctx = canvas.getContext('2d');
  let W, H, ps = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (!ps.length) build();
  }

  function build() {
    const cnt = isMobile() ? 60 : 120;
    ps = Array.from({ length: cnt }, () => ({
      x: rnd(0, W), y: H + rnd(0, 60),
      vx: rnd(-0.3, 0.3), vy: -(rnd(0.4, 1.2)),
      r: rnd(1.5, 4),
      life: rnd(0, 1), decay: rnd(0.003, 0.006),
      hue: rnd(30, 50),
    }));
  }

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.life -= p.decay;
      if (p.life <= 0) { p.x = rnd(0, W); p.y = H + 10; p.life = rnd(0.5, 1); }
      p.x += p.vx; p.y += p.vy;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue},90%,65%,${p.life * 0.6})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(draw);
}

/* ══════════════════════════════════════
   FLOATING WHATSAPP
══════════════════════════════════════ */
function initFloatWA() {
  const btn = $('#floatWA');
  if (!btn) return;
  let shown = false;
  window.addEventListener('scroll', () => {
    if (!shown && window.scrollY > 400) {
      shown = true;
      btn.classList.add('show');
    }
  }, { passive: true });
}

/* ══════════════════════════════════════
   ACTIVE NAV ON SCROLL
══════════════════════════════════════ */
function initActiveNavHighlight() {
  const sections = $$('section[id]');
  const links    = $$('.nav-link');
  if (!sections.length || !links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const href = a.getAttribute('href') || '';
        a.classList.toggle('active', href === `#${e.target.id}`);
      });
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
}

/* ══════════════════════════════════════
   GLOWING CURSOR TRAIL ON SERVICE CARDS
══════════════════════════════════════ */
function initCardMouseGlow() {
  if (isTouch()) return;
  $$('.srv-card').forEach(card => {
    const glow = card.querySelector('.srv-card-glow');
    if (!glow) return;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      glow.style.left = `${e.clientX - r.left - 100}px`;
      glow.style.top  = `${e.clientY - r.top  - 100}px`;
    });
  });
}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot() {
  document.body.classList.add('loading');
  initScrollBar();
  initPreloader();
  initCursor();
  initNav();
  initMagnetic();
  initStarField();
  initHeroCanvas();
  initCtaCanvas();
  initFloatWA();
  initActiveNavHighlight();
  initCardMouseGlow();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
