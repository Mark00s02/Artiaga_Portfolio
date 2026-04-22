// ============================================================
// parallax.js — Hero Parallax Effect (fixed)
// ============================================================

(function () {

  const LAYERS = [
    { id: 'parallaxOrb1',      speedY: 0.18, speedX: 0.04 },
    { id: 'parallaxOrb2',      speedY: 0.12, speedX: 0.06 },
    { id: 'parallaxGrid',      speedY: 0.06, speedX: 0.02 },
    { id: 'parallaxParticles', speedY: 0.22, speedX: 0.0  },
    { id: 'parallaxLines',     speedY: 0.14, speedX: 0.0  },
  ];

  function spawnParticles() {
    const container = document.getElementById('parallaxParticles');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['var(--blue)', 'var(--green)', '#60a5fa', '#34d399'];
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('div');
      el.className = 'p-particle';
      const size = Math.random() * 4 + 2;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 95}%; top:${Math.random() * 95}%;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        --dur:${(Math.random() * 4 + 3).toFixed(1)}s;
        --delay:-${(Math.random() * 4).toFixed(1)}s;
      `;
      container.appendChild(el);
    }
  }

  const snippets = [
    'const dev = new Developer("Marc00s");',
    'git commit -m "feat: ship it"',
    'npm run build --mode=production',
    'async function buildGame() { ... }',
    'docker compose up --build',
    'unity.Instantiate(prefab, pos, rot);',
    'res.json({ status: "deployed" });',
    'while(true) { keepCoding(); }',
    'SELECT * FROM projects ORDER BY quality;',
    'export default function Portfolio() {}',
  ];

  function spawnCodeLines() {
    const container = document.getElementById('parallaxLines');
    if (!container) return;
    container.innerHTML = '';
    snippets.forEach(text => {
      const el = document.createElement('div');
      el.className = 'p-line';
      el.textContent = text;
      el.style.cssText = `
        left:${Math.random() * 65}%; top:${Math.random() * 88}%;
        --dur:${(Math.random() * 5 + 7).toFixed(1)}s;
        --delay:-${(Math.random() * 7).toFixed(1)}s;
      `;
      container.appendChild(el);
    });
  }

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
    const term    = hero?.querySelector('.hero-terminal');
    if (!content) return;
    const scrollY = window.scrollY, heroH = hero.offsetHeight;
    const fadeStart = heroH * 0.25, fadeEnd = heroH * 0.7;
    if (scrollY <= fadeStart) {
      content.style.opacity = '1'; content.style.transform = 'translateY(0)';
      if (term) { term.style.opacity = '1'; term.style.transform = 'translateY(0)'; }
    } else if (scrollY < fadeEnd) {
      const p = (scrollY - fadeStart) / (fadeEnd - fadeStart);
      content.style.opacity = 1 - p * 0.85;
      content.style.transform = `translateY(-${p * 28}px)`;
      if (term) { term.style.opacity = 1 - p * 0.85; term.style.transform = `translateY(-${p * 14}px)`; }
    }
  }
  window.addEventListener('scroll', () => requestAnimationFrame(applyHeroFade), { passive: true });

  function heroEntrance() {
    const hero = document.getElementById('heroSection');
    if (!hero) return;
    const els = ['.hero-prompt','.hero-title','.hero-sub','.hero-btns','.hero-stack','.hero-terminal']
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
    spawnParticles();
    spawnCodeLines();
    applyParallax();
    heroEntrance();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
