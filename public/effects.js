// ============================================================
// effects.js — Animations & Immersive Effects
// ============================================================

// ---- TEXT SCRAMBLE ----
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}=+*^?#01アカシタナ';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const len = newText.length;
    const promise = new Promise(resolve => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < len; i++) {
      const start = Math.floor(Math.random() * 10);
      const end   = start + Math.floor(Math.random() * 10) + 4;
      this.queue.push({ to: newText[i], start, end, char: '' });
    }
    cancelAnimationFrame(this.raf);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const q = this.queue[i];
      if (this.frame >= q.end) {
        complete++;
        output += q.to === ' ' ? ' ' : `<span>${q.to}</span>`;
      } else if (this.frame >= q.start) {
        if (!q.char || Math.random() < 0.28) {
          q.char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }
        output += `<span class="scramble-rand">${q.char}</span>`;
      } else {
        output += q.to === ' ' ? ' ' : `<span class="scramble-dim">${q.to}</span>`;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.raf = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

function initScramble() {
  document.querySelectorAll('.hero-title .title-line').forEach((line, i) => {
    const text = line.textContent.trim();
    const scrambler = new TextScramble(line);
    setTimeout(() => scrambler.setText(text), 600 + i * 250);
  });
}

// ---- HERO SPOTLIGHT ----
function initSpotlight() {
  const hero = document.getElementById('heroSection');
  if (!hero) return;
  let spot = hero.querySelector('.hero-spotlight');
  if (!spot) {
    spot = document.createElement('div');
    spot.className = 'hero-spotlight';
    hero.insertBefore(spot, hero.firstChild);
  }
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    spot.style.background = `radial-gradient(700px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(59,130,246,0.09), transparent 55%)`;
  });
  hero.addEventListener('mouseleave', () => { spot.style.background = ''; });
}

// ---- 3D CARD TILT ----
function initCardTilt() {
  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform   = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(12px)`;
      card.style.transition  = 'transform 0.08s ease, border-color 0.28s, box-shadow 0.28s';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1), border-color 0.28s, box-shadow 0.28s';
    });
  });
}

// ---- MAGNETIC BUTTONS ----
function initMagneticBtns() {
  document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
      btn.style.transform  = `translate(${dx}px, ${dy}px)`;
      btn.style.transition = 'transform 0.1s ease';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform  = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
    });
  });
}

// ---- PAGE TRANSITION ----
function initPageTransition() {
  const overlay = document.getElementById('pageTransOverlay');
  if (!overlay || window._ptWrapped) return;
  window._ptWrapped = true;
  const _orig = window.navigate;
  window.navigate = function (page) {
    overlay.classList.add('active');
    setTimeout(() => {
      _orig(page);
      overlay.classList.remove('active');
      setTimeout(() => { initCardTilt(); initMagneticBtns(); }, 80);
    }, 200);
  };
}

// ---- WORKS GRID STAGGER (MutationObserver) ----
function initWorksObserver() {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;
  let firstRun = true;
  const obs = new MutationObserver(() => {
    const cards = grid.querySelectorAll('.work-card');
    if (!cards.length) return;
    if (!firstRun) return;
    firstRun = false;
    cards.forEach((card, i) => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.45s ease, transform 0.45s ease, border-color 0.28s, box-shadow 0.28s';
        card.style.opacity    = '1';
        card.style.transform  = '';
      }, 60 + i * 75);
    });
    setTimeout(initCardTilt, cards.length * 75 + 100);
    firstRun = true; // allow re-stagger on filter
  });
  obs.observe(grid, { childList: true });
}

// ---- STAT GLOW ON HOVER ----
function initStatGlow() {
  document.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      const n = item.querySelector('.stat-num');
      if (n) n.style.textShadow = '0 0 24px var(--blue)';
    });
    item.addEventListener('mouseleave', () => {
      const n = item.querySelector('.stat-num');
      if (n) n.style.textShadow = '';
    });
  });
}

// ---- NAV LOGO CHROMATIC ABERRATION ----
function initNavChroma() {
  const logo = document.querySelector('.nav-logo');
  if (!logo) return;
  logo.addEventListener('mouseenter', () => {
    logo.classList.add('chroma');
  });
  logo.addEventListener('animationend', () => logo.classList.remove('chroma'));
}

// ---- MARQUEE PAUSE + LIFT ----
function initMarqueeLift() {
  document.querySelectorAll('.marquee-card').forEach(card => {
    card.style.transition = 'transform 0.28s ease, border-color 0.28s, box-shadow 0.28s';
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-5px)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ---- ABOUT IMAGE SCAN SWEEP ----
function initImageScan() {
  const frame = document.querySelector('.about-img-frame');
  if (!frame) return;
  frame.addEventListener('mouseenter', () => frame.classList.add('scanning'));
  frame.addEventListener('animationend', () => frame.classList.remove('scanning'));
}

// ---- INIT ----
function initAllEffects() {
  initSpotlight();
  initMagneticBtns();
  initNavChroma();
  initStatGlow();
  initWorksObserver();
  initMarqueeLift();
  initImageScan();
  initPageTransition();
}

document.addEventListener('DOMContentLoaded', () => {
  initAllEffects();
  setTimeout(initScramble, 400);
});
