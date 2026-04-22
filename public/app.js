// ============================================================
// app.js — Mark00s Portfolio (async API version)
// ============================================================

let currentPage = 'home';
let carouselIndex = 0;
let carouselItems = [];
let selectedStars = 5;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yr').textContent = new Date().getFullYear();
  initCursor();
  navigate('home');
  initStarPicker();
  initScrollReveal();
});

// ---- CUSTOM CURSOR ----
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursorTrail');
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    setTimeout(() => {
      trail.style.left = e.clientX + 'px';
      trail.style.top  = e.clientY + 'px';
    }, 80);
  });
  document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
    cursor.style.background = 'var(--green)';
  });
  document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursor.style.background = 'var(--blue)';
  });
}

// ---- NAVIGATION ----
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const isAdmin = ['admin-login', 'admin'].includes(page);
  document.getElementById('navbar').style.display     = isAdmin ? 'none' : '';
  document.getElementById('siteFooter').style.display = isAdmin ? 'none' : '';

  const pageEl = document.getElementById('page-' + page);
  if (!pageEl) return;
  pageEl.classList.add('active');
  window.scrollTo(0, 0);
  currentPage = page;

  const navMap = { home: 0, about: 1, works: 2, reviews: 3 };
  const navLinks = document.querySelectorAll('.nav-link');
  if (navMap[page] !== undefined && navLinks[navMap[page]])
    navLinks[navMap[page]].classList.add('active');

  if (page === 'home')    renderHome();
  if (page === 'about')   renderAbout();
  if (page === 'works')   renderWorks();
  if (page === 'reviews') renderReviews();
  if (page === 'admin')   renderAdmin();

  setTimeout(initScrollReveal, 100);
}

// ---- HOME ----
async function renderHome() {
  startMatrixRain();
  startTypewriter();
  startTerminal();
  await renderCarousel();
  await renderReviewsMarquee();
  await renderHeroStack();
  await renderStats();
  setTimeout(animateStats, 600);
}

async function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  try {
    const about = await DB.getAbout();
    const stats = about.stats || [
      { num: 40, suffix: '+',   label: 'Projects Shipped' },
      { num: 98, suffix: '%',   label: 'Client Satisfaction' },
      { num: 5,  suffix: 'yrs', label: 'In The Game' },
      { num: 12, suffix: 'k+',  label: 'Lines Committed' },
    ];
    grid.innerHTML = stats.map(s => `
      <div class="stat-item">
        <div class="stat-bar"></div>
        <span class="stat-num" data-target="${s.num}">0</span>
        <span class="stat-suf">${s.suffix}</span>
        <p>${s.label}</p>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '';
  }
}

// ---- MATRIX RAIN ----
function startMatrixRain() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
  const fontSize = 13;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array(cols).fill(1);
  function draw() {
    ctx.fillStyle = 'rgba(6,8,16,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px Share Tech Mono';
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const r = Math.random();
      ctx.fillStyle = r > 0.95 ? '#22c55e' : r > 0.5 ? '#1d4ed8' : '#0f2a5e';
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  if (window._matrixTimer) clearInterval(window._matrixTimer);
  window._matrixTimer = setInterval(draw, 40);
}

// ---- TYPEWRITER ----
function startTypewriter() {
  const el = document.getElementById('typedCmd');
  if (!el) return;
  const cmd = 'run portfolio --mode=awesome';
  let i = 0; el.textContent = '';
  if (window._typeTimer) clearInterval(window._typeTimer);
  window._typeTimer = setInterval(() => {
    if (i < cmd.length) { el.textContent += cmd[i++]; }
    else clearInterval(window._typeTimer);
  }, 60);
}

// ---- TERMINAL ----
const termLines = [
  { type: 'cmd',       text: 'node server.js' },
  { type: 'out',       text: '> Mark00s Portfolio v2.0' },
  { type: 'out',       text: '> Starting server...' },
  { type: 'highlight', text: '✓ Server running on :3000' },
  { type: 'comment',   text: '// Connecting to database...' },
  { type: 'blue',      text: '> [DB] works.db loaded' },
  { type: 'blue',      text: '> [DB] reviews.db loaded' },
  { type: 'blue',      text: '> [DB] about.db loaded' },
  { type: 'highlight', text: '✓ All systems nominal' },
  { type: 'comment',   text: '' },
  { type: 'cmd',       text: 'git log --oneline -4' },
  { type: 'out',       text: 'a3f9c12 feat: real-time multiplayer' },
  { type: 'out',       text: 'b82e1d4 fix: dungeon gen edge case' },
  { type: 'out',       text: 'c91f3aa perf: optimize API queries' },
  { type: 'out',       text: 'd45b2cc feat: leaderboard system' },
  { type: 'comment',   text: '' },
  { type: 'cmd',       text: 'npm run build' },
  { type: 'highlight', text: '✓ Build complete in 1.42s' },
];
function startTerminal() {
  const body = document.getElementById('terminalBody');
  if (!body) return;
  body.innerHTML = ''; let i = 0;
  if (window._termTimer) clearInterval(window._termTimer);
  window._termTimer = setInterval(() => {
    if (i >= termLines.length) { clearInterval(window._termTimer); return; }
    const line = termLines[i++];
    const span = document.createElement('span');
    span.className = 't-line t-' + line.type;
    span.textContent = line.type === 'cmd' ? '$ ' + line.text : line.text;
    body.appendChild(span);
    body.scrollTop = body.scrollHeight;
  }, 180);
}

// ---- HERO STACK ----
async function renderHeroStack() {
  const el = document.getElementById('heroStack');
  if (!el) return;
  try {
    const a = await DB.getAbout();
    const stack = (a.stack || 'React,Node.js,Unity,C#,PostgreSQL,Python,Docker').split(',');
    el.innerHTML = stack.map(s => `<span class="stack-pill">${s.trim()}</span>`).join('');
  } catch {}
}

// ---- CAROUSEL ----
async function renderCarousel() {
  try {
    carouselItems = await DB.getFeaturedWorks();
  } catch { carouselItems = []; }
  const track = document.getElementById('carouselTrack');
  const dots  = document.getElementById('carouselDots');
  if (!track || !carouselItems.length) return;
  const fallback = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800';
  track.innerHTML = carouselItems.map(w => {
    const tags = (w.tags || '').split(',').map(t => `<span>${t.trim()}</span>`).join('');
    return `
      <div class="carousel-slide" onclick="openModal('${w._id}')">
        <div class="carousel-img" style="background-image:url('${w.img || fallback}')"></div>
        <div class="carousel-info">
          <span class="carousel-cat">${w.cat}</span>
          <h3>${w.title}</h3>
          <p>${w.desc.substring(0, 100)}...</p>
          <div class="carousel-tech">${tags}</div>
          <span class="carousel-cta">// view_project →</span>
        </div>
      </div>`;
  }).join('');
  dots.innerHTML = carouselItems.map((_, i) =>
    `<span class="dot-btn ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`
  ).join('');
  carouselIndex = 0;
  updateCarousel();
}

function moveCarousel(dir) {
  carouselIndex = (carouselIndex + dir + carouselItems.length) % carouselItems.length;
  updateCarousel();
}
function goToSlide(i) { carouselIndex = i; updateCarousel(); }
function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  track.style.transform = `translateX(-${carouselIndex * 100}%)`;
  document.querySelectorAll('.dot-btn').forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
}
setInterval(() => { if (currentPage === 'home' && carouselItems.length > 1) moveCarousel(1); }, 5500);

// ---- STATS ----
function animateStats() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ---- REVIEWS MARQUEE ----
async function renderReviewsMarquee() {
  const marquee = document.getElementById('reviewsMarquee');
  if (!marquee) return;
  try {
    const reviews = (await DB.getReviews()).slice(0, 8);
    const cards = reviews.map(r => `
      <div class="marquee-card" onclick="navigate('reviews')">
        <div class="marquee-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        <p>"${r.text}"</p>
        <div class="marquee-author"><strong>${r.name}</strong><span>${r.role}</span></div>
      </div>`).join('');
    marquee.innerHTML = cards + cards;
  } catch {}
}

// ---- ABOUT ----
async function renderAbout() {
  try {
    const a = await DB.getAbout();
    setEl('aboutNameDisplay', a.name || 'Mark00s');
    setEl('aboutRoleDisplay', a.role || 'Full Stack & Game Developer');
    const bioEl = document.getElementById('aboutBioDisplay');
    if (bioEl) bioEl.innerHTML = a.bio || '';
    const skillsEl = document.getElementById('skillsDisplay');
    if (skillsEl && a.skills)
      skillsEl.innerHTML = a.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('');
    const imgEl = document.getElementById('aboutImgDisplay');
    if (imgEl && a.photo) {
      imgEl.style.backgroundImage = `url('${a.photo}')`;
      imgEl.style.backgroundSize = 'cover';
      imgEl.style.backgroundPosition = 'center';
      const ph = imgEl.querySelector('.img-placeholder-text');
      if (ph) ph.style.display = 'none';
    }
    const socialEl = document.getElementById('socialLinksDisplay');
    if (socialEl && a.social)
      socialEl.innerHTML = a.social.split('\n').map(line => {
        const [label, url] = line.split('|');
        return label && url ? `<a href="${url.trim()}" class="social-link" target="_blank">${label.trim()}</a>` : '';
      }).join('');
  } catch (e) { console.error('renderAbout:', e); }
}

// ---- WORKS ----
async function renderWorks() {
  try {
    const works = await DB.getWorks();
    initKineticCollage(works);
    const cats  = [...new Set(works.map(w => w.cat))];
    const filterEl = document.getElementById('worksFilter');
    if (filterEl)
      filterEl.innerHTML =
        `<button class="filter-btn active" data-filter="all" onclick="filterWorks('all',this)">all</button>` +
        cats.map(c => `<button class="filter-btn" data-filter="${c}" onclick="filterWorks('${c}',this)">${c}</button>`).join('');
    renderWorksGrid(works);
  } catch (e) { console.error('renderWorks:', e); }
}

async function filterWorks(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const works = await DB.getWorks();
  renderWorksGrid(cat === 'all' ? works : works.filter(w => w.cat === cat));
}

function renderWorksGrid(works) {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;
  const fallback = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800';
  grid.innerHTML = works.map(w => {
    const tags = (w.tags || '').split(',').map(t => `<span>${t.trim()}</span>`).join('');
    return `
      <div class="work-card" onclick="openModal('${w._id}')">
        <div class="work-img" style="background-image:url('${w.img || fallback}')">
          <div class="work-overlay">
            <span class="work-cat">${w.cat}</span>
            <h3>${w.title}</h3>
            <div class="work-tech">${tags}</div>
            <span class="work-view">// view_project →</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ---- MODAL ----
let _allWorks = [];
async function openModal(id) {
  try {
    if (!_allWorks.length) _allWorks = await DB.getWorks();
    const work = _allWorks.find(w => w._id === id);
    if (!work) return;
    const fallback = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800';
    document.getElementById('modalImg').src = work.img || fallback;
    document.getElementById('modalTitle').textContent = work.title;
    document.getElementById('modalCat').textContent   = work.cat;
    document.getElementById('modalDesc').textContent  = work.desc;
    const tagsEl = document.getElementById('modalTags');
    if (tagsEl) tagsEl.innerHTML = (work.tags || '').split(',').map(t => `<span>${t.trim()}</span>`).join('');
    document.getElementById('workModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (e) { console.error('openModal:', e); }
}
function closeModal() {
  document.getElementById('workModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ---- CONTACT MODAL ----
function openContact() {
  document.getElementById('contactModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('contactFormMsg').textContent = '';
  document.getElementById('cSubmitBtn').disabled = false;
  document.getElementById('cSubmitBtn').innerHTML = '<span class="btn-icon">▶</span> Send Message';
}

function closeContact() {
  document.getElementById('contactModal').classList.remove('active');
  document.body.style.overflow = '';
}

async function submitContact() {
  const name    = document.getElementById('cName').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const subject = document.getElementById('cSubject').value.trim();
  const message = document.getElementById('cMessage').value.trim();
  if (!name || !email || !message) {
    flash('contactFormMsg', '// error: name, email, and message are required', 'error');
    return;
  }
  const btn = document.getElementById('cSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">▶</span> Sending...';
  try {
    await DB.sendContact({ name, email, subject, message });
    flash('contactFormMsg', '// message sent — I\'ll be in touch soon!', 'success');
    document.getElementById('cName').value    = '';
    document.getElementById('cEmail').value   = '';
    document.getElementById('cSubject').value = '';
    document.getElementById('cMessage').value = '';
    btn.innerHTML = '<span class="btn-icon">▶</span> Send Message';
    setTimeout(closeContact, 2500);
  } catch (e) {
    flash('contactFormMsg', '// ' + (e.message || 'send failed — try again'), 'error');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> Send Message';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeContact(); } });

// ---- REVIEWS ----
async function renderReviews() {
  try {
    const reviews = await DB.getReviews();
    const avg = await DB.getAvgRating();
    setEl('avgRatingDisplay', avg);
    setEl('avgStarsDisplay', '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg)));
    setEl('totalReviewsDisplay', `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`);
    const grid = document.getElementById('reviewsFullGrid');
    if (!grid) return;
    grid.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-author">
          <strong>${r.name}</strong>
          <span>${r.role}</span>
          <small>${r.date}</small>
        </div>
      </div>`).join('');
  } catch (e) { console.error('renderReviews:', e); }
}

// ---- STAR PICKER ----
function initStarPicker() {
  const picker = document.getElementById('starPicker');
  if (!picker) return;
  picker.querySelectorAll('span').forEach(star => {
    star.addEventListener('click', () => {
      selectedStars = parseInt(star.dataset.val);
      picker.querySelectorAll('span').forEach((s, i) => s.classList.toggle('active', i < selectedStars));
    });
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      picker.querySelectorAll('span').forEach((s, i) => s.classList.toggle('hover', i < val));
    });
    star.addEventListener('mouseleave', () => {
      picker.querySelectorAll('span').forEach(s => s.classList.remove('hover'));
    });
  });
  picker.querySelectorAll('span').forEach(s => s.classList.add('active'));
}

async function submitReview() {
  const name = document.getElementById('reviewName').value.trim();
  const role = document.getElementById('reviewRole').value.trim();
  const text = document.getElementById('reviewText').value.trim();
  const msg  = document.getElementById('reviewMsg');
  if (!name || !text) {
    msg.textContent = '// error: name and review text required';
    msg.className = 'form-msg error'; return;
  }
  try {
    await DB.addReview({ name, role, rating: selectedStars, text });
    msg.textContent = '// success: review submitted for approval';
    msg.className = 'form-msg success';
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewRole').value = '';
    document.getElementById('reviewText').value = '';
  } catch (e) {
    msg.textContent = '// error: could not submit review';
    msg.className = 'form-msg error';
  }
}

// ---- ADMIN ----
function adminLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  const err  = document.getElementById('loginErr');
  if (user === 'User' && pass === 'Pass123') {
    sessionStorage.setItem('admin_auth', '1');
    navigate('admin');
  } else {
    err.textContent = '// error: invalid credentials';
    err.className = 'form-msg error';
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_auth');
  navigate('home');
}

async function renderAdmin() {
  if (!sessionStorage.getItem('admin_auth')) { navigate('admin-login'); return; }
  try {
    const works   = await DB.getWorks();
    const reviews = await DB.getAllReviews();
    const avg     = await DB.getAvgRating();
    setEl('dc-works',   works.length);
    setEl('dc-reviews', reviews.length);
    setEl('dc-rating',  avg);

    const a = await DB.getAbout();
    setVal('aName',   a.name);
    setVal('aRole',   a.role);
    setVal('aBio',    a.bio ? a.bio.replace(/<p>/g,'').replace(/<\/p>/g,'\n\n').trim() : '');
    setVal('aSkills', a.skills);
    setVal('aPhoto',  a.photo);
    setVal('aSocial', a.social);
    setVal('aStack',  a.stack);

    const defaultStats = [
      { num: 40, suffix: '+',   label: 'Projects Shipped' },
      { num: 98, suffix: '%',   label: 'Client Satisfaction' },
      { num: 5,  suffix: 'yrs', label: 'In The Game' },
      { num: 12, suffix: 'k+',  label: 'Lines Committed' },
    ];
    const stats = a.stats || defaultStats;
    document.getElementById('statsAdminList').innerHTML = stats.map((s, i) => `
      <div style="display:grid;grid-template-columns:70px 80px 1fr;gap:.5rem;margin-bottom:.5rem;align-items:center">
        <input type="number" id="sNum${i}" value="${s.num}" placeholder="40" style="text-align:center" />
        <input type="text"   id="sSuf${i}" value="${s.suffix}" placeholder="+" style="text-align:center" />
        <input type="text"   id="sLab${i}" value="${s.label}" placeholder="Projects Shipped" />
      </div>
    `).join('');

    const cs = await DB.getSettings();
    setVal('cToEmail',   cs.to_email   || '');
    setVal('cFromEmail', cs.from_email || '');
    setVal('cFromName',  cs.from_name  || '');
    setVal('cResendKey', cs.resend_api_key || '');

    await renderAdminWorks();
    await renderAdminReviews();
  } catch (e) { console.error('renderAdmin:', e); }
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-link').forEach(l => l.classList.remove('active'));
  document.getElementById('admin-tab-' + tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('aPhotoFilename').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('aPhotoPreview');
    preview.style.backgroundImage = `url('${e.target.result}')`;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function saveAbout() {
  const rawBio = document.getElementById('aBio').value.trim();
  const bio = rawBio.split('\n\n').map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  try {
    let photo = document.getElementById('aPhoto').value.trim();

    const fileInput = document.getElementById('aPhotoFile');
    if (fileInput.files[0]) {
      flash('aboutMsg', '// uploading image...', 'success');
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) { flash('aboutMsg', '// upload failed', 'error'); return; }
      const { url } = await res.json();
      photo = url;
      document.getElementById('aPhoto').value = url;
      fileInput.value = '';
      document.getElementById('aPhotoFilename').textContent = '';
    }

    const stats = [0, 1, 2, 3].map(i => ({
      num:    parseInt(document.getElementById('sNum' + i)?.value) || 0,
      suffix: document.getElementById('sSuf' + i)?.value.trim() || '',
      label:  document.getElementById('sLab' + i)?.value.trim() || '',
    }));

    await DB.saveAbout({
      name:   document.getElementById('aName').value.trim(),
      role:   document.getElementById('aRole').value.trim(),
      bio,
      skills: document.getElementById('aSkills').value.trim(),
      photo,
      social: document.getElementById('aSocial').value.trim(),
      stack:  document.getElementById('aStack').value.trim(),
      stats,
    });
    flash('aboutMsg', '// saved successfully', 'success');
  } catch { flash('aboutMsg', '// error saving', 'error'); }
}

async function saveContactSettings() {
  try {
    await DB.saveSettings({
      to_email:       document.getElementById('cToEmail').value.trim(),
      from_email:     document.getElementById('cFromEmail').value.trim(),
      from_name:      document.getElementById('cFromName').value.trim(),
      resend_api_key: document.getElementById('cResendKey').value.trim(),
    });
    flash('contactSettingsMsg', '// settings saved', 'success');
  } catch { flash('contactSettingsMsg', '// error saving', 'error'); }
}

async function addWork() {
  const title = document.getElementById('wTitle').value.trim();
  const cat   = document.getElementById('wCat').value.trim();
  if (!title || !cat) { flash('workMsg','// error: title and category required','error'); return; }
  try {
    await DB.addWork({
      title, cat,
      desc:     document.getElementById('wDesc').value.trim(),
      img:      document.getElementById('wImg').value.trim(),
      tags:     document.getElementById('wTags').value.trim(),
      featured: document.getElementById('wFeatured').value === 'true',
    });
    flash('workMsg','// project added','success');
    ['wTitle','wCat','wDesc','wImg','wTags'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    _allWorks = [];
    await renderAdminWorks();
  } catch { flash('workMsg','// error adding project','error'); }
}

async function renderAdminWorks() {
  const list = document.getElementById('adminWorksList');
  if (!list) return;
  const works = await DB.getWorks();
  list.innerHTML = works.map(w => `
    <div class="admin-item">
      <div class="admin-item-img" style="background-image:url('${w.img}')"></div>
      <div class="admin-item-info">
        <strong>${w.title}</strong>
        <span>${w.cat}${w.featured ? ' · ⭐ featured' : ''}</span>
        <p>${(w.tags||'').substring(0,60)}</p>
      </div>
      <button onclick="deleteWork('${w._id}')" class="btn-delete">rm</button>
    </div>`).join('');
}

async function deleteWork(id) {
  if (!confirm('Delete this project?')) return;
  await DB.deleteWork(id);
  _allWorks = [];
  await renderAdminWorks();
  flash('workMsg','// project removed','success');
}

async function renderAdminReviews() {
  const list = document.getElementById('adminReviewsList');
  if (!list) return;
  const reviews = await DB.getAllReviews();
  list.innerHTML = reviews.map(r => `
    <div class="admin-item">
      <div class="admin-item-info">
        <strong>${r.name}</strong> — ${'★'.repeat(r.rating)}
        <p>"${r.text.substring(0,100)}..."</p>
        <span>${r.role} · ${r.date} · ${r.approved
          ? '<span style="color:var(--green)">approved</span>'
          : '<span style="color:#fb923c">pending</span>'}</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        ${!r.approved ? `<button onclick="approveReview('${r._id}')" class="btn-approve">approve</button>` : ''}
        <button onclick="deleteReview('${r._id}')" class="btn-delete">rm</button>
      </div>
    </div>`).join('');
}

async function approveReview(id) {
  await DB.approveReview(id);
  await renderAdminReviews();
}
async function deleteReview(id) {
  if (!confirm('Delete?')) return;
  await DB.deleteReview(id);
  await renderAdminReviews();
}

// ---- KINETIC TYPOGRAPHY COLLAGE ----
let _ktcRaf    = null;
let _ktcActive = false;
let _ktcWorks  = [];
let _ktcPool   = [];   // pool of all living elements
let _ktcT      = 0;    // global time ms
let _ktcLast   = null;
let _ktcNextSpawn = 0; // when to spawn next wave

// How long each element lives (ms)
const EL_LIFE   = 3200;
const SPAWN_INT = 420;  // ms between spawns

function initKineticCollage(works) {
  const stage   = document.getElementById('ktcStage');
  const overlay = document.getElementById('ktcOverlay');
  const canvas  = document.getElementById('ktcCanvas');
  if (!stage || !works.length) { renderWorksGrid(works); return; }

  _ktcWorks  = works;
  _ktcActive = true;
  _ktcPool   = [];
  _ktcT      = 0;
  _ktcLast   = null;
  _ktcNextSpawn = 0;

  stage.classList.remove('ktc-done');
  stage.style.display  = '';
  stage.style.opacity  = '1';
  stage.style.width    = '100%';
  overlay.innerHTML    = '';

  if (_ktcRaf) cancelAnimationFrame(_ktcRaf);

  function getWH() {
    return { W: stage.offsetWidth || window.innerWidth, H: stage.offsetHeight || window.innerHeight };
  }
  let { W, H } = getWH();
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Resize handler — re-sync canvas when window size changes
  function onResize() {
    const dims = getWH();
    W = dims.W; H = dims.H;
    canvas.width  = W;
    canvas.height = H;
  }
  window.addEventListener('resize', onResize);

  // Spawn an initial burst so screen isn't empty on first frame
  for (let i = 0; i < 10; i++) spawnElement(overlay, W, H, -i * 280);

  function tick(ts) {
    if (!_ktcActive) return;
    if (!_ktcLast) _ktcLast = ts;
    const dt = ts - _ktcLast;
    _ktcLast  = ts;
    _ktcT    += dt;

    // Draw canvas background
    drawCanvasBg(ctx, W, H, _ktcT);

    // Spawn new elements on interval
    if (_ktcT >= _ktcNextSpawn) {
      spawnElement(overlay, W, H, 0);
      _ktcNextSpawn = _ktcT + SPAWN_INT;
    }

    // Update all living elements
    const dead = [];
    _ktcPool.forEach(item => {
      const age      = _ktcT - item.born;
      const lifespan = item.lifespan || EL_LIFE;
      const t        = Math.min(age / lifespan, 1);

      if (age < 0) { item.el.style.opacity = '0'; return; } // not born yet

      // Easing
      const easeIn  = easeOutExpo(Math.min(age / 500, 1));
      const easeOut = age > lifespan - 600
        ? 1 - easeOutExpo(Math.min((lifespan - age) / 600, 1))
        : 0;
      const op = Math.max(0, Math.min(1, easeIn - easeOut) * (item.maxOp || 1));
      item.el.style.opacity = op;

      // Continuous drift motion
      const drift = age * item.driftSpeed;
      const wobble = Math.sin(age * item.wobbleFreq + item.wobblePhase) * item.wobbleAmp;
      const tx = item.dx * easeOutExpo(Math.min(age / 600, 1)) + wobble;
      const ty = item.dy * easeOutExpo(Math.min(age / 600, 1)) + drift;
      const rot = item.rot + age * item.rotSpeed;
      const sc  = item.scaleFrom + (1 - item.scaleFrom) * easeOutExpo(Math.min(age / 700, 1));

      item.el.style.transform = `rotate(${rot}deg) scale(${sc}) translate(${tx}px, ${ty}px)`;

      if (age >= lifespan) dead.push(item);
    });

    // Remove dead elements
    dead.forEach(item => {
      item.el.remove();
      _ktcPool.splice(_ktcPool.indexOf(item), 1);
    });

    _ktcRaf = requestAnimationFrame(tick);
  }

  _ktcRaf = requestAnimationFrame(tick);
}

// Element type weights for variety
const TYPE_WEIGHTS = [
  'title','title','title',        // titles appear most
  'img','img',                    // images second most
  'bg-word','bg-word',
  'cat',
  'slash',
  'index',
  'line',
];

function spawnElement(overlay, W, H, bornOffset) {
  const type  = TYPE_WEIGHTS[Math.floor(Math.random() * TYPE_WEIGHTS.length)];
  const work  = _ktcWorks[Math.floor(Math.random() * _ktcWorks.length)];
  const div   = document.createElement('div');
  div.className = 'ktc-el type-' + type;

  // Randomised physics
  const item = {
    el:          div,
    born:        _ktcT + (bornOffset || 0),
    lifespan:    EL_LIFE + (Math.random() - 0.5) * 1200,
    rot:         (Math.random() - 0.5) * 20,
    rotSpeed:    (Math.random() - 0.5) * 0.012,
    scaleFrom:   0.6 + Math.random() * 0.5,
    dx:          (Math.random() - 0.5) * 80,
    dy:          (Math.random() - 0.5) * 60,
    driftSpeed:  (Math.random() - 0.5) * 0.018,
    wobbleFreq:  0.001 + Math.random() * 0.002,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmp:   4 + Math.random() * 12,
    maxOp:       1,
  };

  // Position — avoid dead center so content isn't too cluttered
  let x, y;
  const zone = Math.floor(Math.random() * 9); // 3x3 grid zones
  const zx   = (zone % 3) / 3;
  const zy   = Math.floor(zone / 3) / 3;
  x = zx * W + Math.random() * (W / 3);
  y = zy * H + Math.random() * (H / 3);

  switch (type) {

    case 'bg-word': {
      const words = ['BUILD','SHIP','CODE','PLAY','CREATE','DEPLOY','DEBUG','LAUNCH','DESIGN','CRAFT'];
      div.textContent = words[Math.floor(Math.random() * words.length)];
      const sz = 80 + Math.random() * 120;
      div.style.fontSize = sz + 'px';
      item.maxOp   = 0.35;
      item.scaleFrom = 1.3;
      item.lifespan  = EL_LIFE * 1.4;
      break;
    }

    case 'title': {
      const words   = work.title.split(' ');
      const first   = words[0];
      const rest    = words.slice(1).join(' ');
      div.innerHTML = `<span class="ktc-accent">${first}</span>${rest ? ' ' + rest : ''}`;
      const sz = 2.2 + Math.random() * 3.5;
      div.style.fontSize = sz + 'rem';
      item.scaleFrom = 0.7;
      // Randomise entry direction
      item.dx = (Math.random() - 0.5) * 140;
      item.dy = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 80);
      break;
    }

    case 'img': {
      if (!work.img) { div.remove(); return; }
      div.style.backgroundImage = `url('${work.img}')`;
      const w = 160 + Math.random() * 120;
      const h = w * 0.65;
      div.style.width  = w + 'px';
      div.style.height = h + 'px';
      item.maxOp     = 0.75;
      item.scaleFrom = 0.5;
      item.lifespan  = EL_LIFE * 1.2;
      item.dx = (Math.random() - 0.5) * 100;
      item.dy = (Math.random() - 0.5) * 80;
      break;
    }

    case 'cat': {
      div.textContent  = work.cat;
      item.scaleFrom   = 0.5;
      item.maxOp       = 0.9;
      break;
    }

    case 'slash': {
      div.textContent    = Math.random() > 0.5 ? '//' : '→';
      div.style.fontSize = (50 + Math.random() * 80) + 'px';
      item.maxOp         = 0.35;
      item.rotSpeed      = (Math.random() - 0.5) * 0.02;
      break;
    }

    case 'index': {
      const idx = _ktcWorks.indexOf(work);
      div.textContent    = String(idx + 1).padStart(2, '0');
      div.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
      item.maxOp         = 0.4;
      break;
    }

    case 'line': {
      const w = 100 + Math.random() * 300;
      div.style.width = w + 'px';
      item.maxOp      = 0.25;
      item.dx         = (Math.random() - 0.5) * 200;
      item.dy         = 0;
      item.wobbleAmp  = 0;
      break;
    }
  }

  div.style.left      = x + 'px';
  div.style.top       = y + 'px';
  div.style.opacity   = '0';
  div.style.transform = `rotate(${item.rot}deg) scale(${item.scaleFrom})`;

  overlay.appendChild(div);
  _ktcPool.push(item);
}

// Canvas BG: scanlines + vignette + blue glow pulse
function drawCanvasBg(ctx, W, H, t) {
  ctx.fillStyle = 'rgba(6,8,16,0.94)';
  ctx.fillRect(0, 0, W, H);

  // Radial glow — pulses and drifts
  const gx  = W / 2 + Math.sin(t / 2200) * W * 0.15;
  const gy  = H / 2 + Math.cos(t / 3100) * H * 0.12;
  const r   = W * 0.55;
  const pulse = 0.07 + Math.sin(t / 900) * 0.04;
  const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
  grd.addColorStop(0, `rgba(59,130,246,${pulse})`);
  grd.addColorStop(0.5, `rgba(34,197,94,${pulse * 0.3})`);
  grd.addColorStop(1, 'rgba(6,8,16,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, H * 0.9);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Occasional horizontal flash line
  if (Math.random() < 0.008) {
    const fy = Math.random() * H;
    ctx.fillStyle = `rgba(59,130,246,${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(0, fy, W, 1 + Math.random() * 2);
  }
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function finishKTC(works) {
  _ktcActive = false;
  if (_ktcRaf) cancelAnimationFrame(_ktcRaf);
  // Clean up resize listener
  try { window.removeEventListener('resize', onResize); } catch(e) {}
  const stage = document.getElementById('ktcStage');
  if (stage) {
    stage.style.transition = 'opacity .5s ease';
    stage.style.opacity    = '0';
    setTimeout(() => {
      stage.classList.add('ktc-done');
      stage.style.opacity    = '';
      stage.style.transition = '';
    }, 500);
  }
  renderWorksGrid(works || _ktcWorks);
}

function skipKTC() {
  finishKTC(_ktcWorks);
}

// ---- UTILS ----// ---- UTILS ----
function setEl(id, val)  { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
function flash(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.className = `form-msg ${type}`;
  setTimeout(() => { el.textContent = ''; }, 3000);
}
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section').forEach(s => obs.observe(s));
}
