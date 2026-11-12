// ============================================================
// parallax.js — Hero Parallax Effect (fixed)
// ============================================================

(function () {

  function applyHeroFade() {
    const hero    = document.getElementById('heroSection');
    const content = hero?.querySelector('.hero-content');
    const status  = hero?.querySelector('.hero-status');
    if (!content) return;
    const scrollY = window.scrollY, heroH = hero.offsetHeight;
    // with the 3D hero the section is 2 screens tall; fade the text during the first screen of scroll
    const span = hero.classList.contains('has-3d') ? heroH - innerHeight : heroH;
    const fadeStart = span * 0.1, fadeEnd = span * 0.6;
    const p = Math.min(1, Math.max(0, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
    const o = 1 - p * (hero.classList.contains('has-3d') ? 1 : 0.85);
    content.style.opacity = o;
    content.style.transform = `translateY(-${p * 28}px)`;
    if (status) { status.style.opacity = o; status.style.transform = `translateY(-${p * 14}px)`; }
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
    heroEntrance();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
