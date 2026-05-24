// ============================================================
// parallax.js — Hero Parallax Effect (fixed)
// ============================================================

(function () {

  const LAYERS = [
    { id: 'parallaxGrid', speedY: 0.06, speedX: 0.02 },
  ];

  let ticking = false, lastMouseX = 0, lastMouseY = 0;

  function applyParallax() {
    const scrollY = window.scrollY;
    const hero = document.getElementById('heroSection');
    if (!hero) { ticking = false; return; }
    if (scrollY > hero.offsetHeight * 1.5) { ticking = false; return; }

    LAYERS.forEach(({ id, speedY, speedX }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const ty = -(scrollY * speedY);
      const mx = (lastMouseX - window.innerWidth  / 2) * speedX * 0.03;
      const my = (lastMouseY - window.innerHeight / 2) * speedX * 0.03;
      el.style.transform = `translate3d(${mx}px, ${ty + my}px, 0)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    if (window.scrollY < window.innerHeight) requestAnimationFrame(applyParallax);
  });

  function applyHeroFade() {
    const hero    = document.getElementById('heroSection');
    const content = hero?.querySelector('.hero-content');
    const status  = hero?.querySelector('.hero-status');
    if (!content) return;
    const scrollY = window.scrollY, heroH = hero.offsetHeight;
    const fadeStart = heroH * 0.25, fadeEnd = heroH * 0.7;
    if (scrollY <= fadeStart) {
      content.style.opacity = '1'; content.style.transform = 'translateY(0)';
      if (status) { status.style.opacity = '1'; status.style.transform = 'translateY(0)'; }
    } else if (scrollY < fadeEnd) {
      const p = (scrollY - fadeStart) / (fadeEnd - fadeStart);
      content.style.opacity = 1 - p * 0.85;
      content.style.transform = `translateY(-${p * 28}px)`;
      if (status) { status.style.opacity = 1 - p * 0.85; status.style.transform = `translateY(-${p * 14}px)`; }
    }
  }
  window.addEventListener('scroll', () => requestAnimationFrame(applyHeroFade), { passive: true });

  function heroEntrance() {
    const hero = document.getElementById('heroSection');
    if (!hero) return;
    const els = ['.hero-prompt','.hero-title','.hero-sub','.avail-badge','.hero-btns','.hero-stack','.hero-status']
      .map(s => hero.querySelector(s)).filter(Boolean);
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = `opacity 0.7s ease ${i*0.11+0.1}s, transform 0.7s ease ${i*0.11+0.1}s`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    }));
  }

  function init() {
    applyParallax();
    heroEntrance();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
