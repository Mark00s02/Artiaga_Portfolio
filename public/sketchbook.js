/* =====================================================================
   Selected Builds as a sketchbook.
   Ported from ThreeUI's MengToSketchbookLandingPage: the curled page turn,
   lighting, spring physics, tilt, zoom and loupe are the original code.
   What changed: each spread is drawn in the browser from a featured work
   as a hologram in the site's colours (screenshot on the left page, a
   readout on the right) instead of a painted PNG, the intro riffle plays
   when the section scrolls into view, and the caption opens the project modal.
   ===================================================================== */
(function () {
const SW = 1760, SH = 1240;                    /* spread canvas, same geometry as the source plates */
const PX0 = 90, PX1 = 1670, PY0 = 270, PY1 = 970, MID = SW / 2;   /* paper: 5.1%..94.9%, 21.8%..78.2% */
const WHITE = '#f0f4ff', MUTED = '#b0bdd4', DIM = '#6b7fa3', BLUE = '#3b82f6', CYAN = '#60a5fa', GREEN = '#22c55e';
const DISPLAY = 'Rajdhani, sans-serif', BODY = '"IBM Plex Sans", sans-serif', MONO = '"JetBrains Mono", monospace';

/* ------------------------------------------------ drawing a spread (hologram) */
const imgCache = new Map();                     /* every screenshot starts downloading at once; drawing waits per page */
function loadImg(src) {
  if (!imgCache.has(src)) imgCache.set(src, fetchImg(src));
  return imgCache.get(src);
}
function fetchImg(src) {
  return new Promise(res => {
    if (!src) return res(null);
    const im = new Image();
    im.crossOrigin = 'anonymous';               /* without CORS the canvas could not be exported */
    im.onload = () => res(im); im.onerror = () => res(null);
    /* github.com/<u>/<r>/blob/<b>/<path>?raw=true redirects without CORS headers; the raw host sends them */
    im.src = src.replace(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/([^?#]+)\?raw=true$/, 'https://raw.githubusercontent.com/$1/$2');
  });
}
function wrapLines(ctx, text, maxW) {
  const lines = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const t = line ? line + ' ' + word : word;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = word; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function drawLines(ctx, lines, x, y, lh, max) {
  const out = lines.slice(0, max);
  if (lines.length > max) out[max - 1] = out[max - 1].replace(/[\s,.;:]+\S*$/, '') + '…';   /* drop the last word for the ellipsis */
  out.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return y + out.length * lh;
}
function glow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; }
function brackets(ctx, x0, y0, x1, y1, len, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    ctx.moveTo(x, y + dy * len); ctx.lineTo(x, y); ctx.lineTo(x + dx * len, y);
  }
  ctx.stroke();
}
function panel(ctx, x0, x1, gutterSide) {
  /* projected light: brighter toward the top, fading at the bottom */
  const f = ctx.createLinearGradient(0, PY0, 0, PY1);
  f.addColorStop(0, 'rgba(22,48,92,.62)'); f.addColorStop(1, 'rgba(9,20,42,.50)');
  ctx.fillStyle = f; ctx.fillRect(x0, PY0, x1 - x0, PY1 - PY0);
  const g = gutterSide === 'right'
    ? ctx.createLinearGradient(x1 - 140, 0, x1, 0) : ctx.createLinearGradient(x0 + 140, 0, x0, 0);
  g.addColorStop(0, 'rgba(2,6,23,0)'); g.addColorStop(1, 'rgba(2,6,23,.45)');
  ctx.fillStyle = g; ctx.fillRect(x0, PY0, x1 - x0, PY1 - PY0);
  ctx.strokeStyle = 'rgba(59,130,246,.09)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0 + 40; x < x1; x += 40) { ctx.moveTo(x, PY0); ctx.lineTo(x, PY1); }
  for (let y = PY0 + 40; y < PY1; y += 40) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();
}
/* lays tags out as chips; returns the rows used. draw=false only measures */
function chips(ctx, tags, x, y, maxW, rows, draw) {
  ctx.font = `400 19px ${MONO}`;
  let cx = x, row = 0;
  for (const t of tags) {
    const w = ctx.measureText(t).width + 26;
    if (cx + w > x + maxW && cx > x) { cx = x; row++; }
    if (row >= rows) { row = rows - 1; break; }
    if (draw) {
      const cy = y + row * 44;
      ctx.fillStyle = 'rgba(59,130,246,.10)'; ctx.strokeStyle = 'rgba(96,165,250,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(cx, cy, w, 34, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CYAN; ctx.fillText(t, cx + 13, cy + 24);
    }
    cx += w + 10;
  }
  return tags.length ? row + 1 : 0;
}
async function makeSpread(w, i, total) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const ctx = c.getContext('2d');

  /* light layers under the pages, like the stacked edge of a book */
  for (let k = 4; k >= 1; k--) {
    ctx.strokeStyle = `rgba(96,165,250,${(.42 - k * .08).toFixed(2)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PX0 + k * 5, PY1 + k * 6); ctx.lineTo(PX1 - k * 5, PY1 + k * 6); ctx.stroke();
  }
  panel(ctx, PX0, MID, 'right');
  panel(ctx, MID, PX1, 'left');
  glow(ctx, 'rgba(59,130,246,.9)', 22);
  ctx.strokeStyle = 'rgba(96,165,250,.75)'; ctx.lineWidth = 2;
  ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  ctx.strokeStyle = 'rgba(147,197,253,.85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(MID, PY0); ctx.lineTo(MID, PY1); ctx.stroke();
  noGlow(ctx);
  brackets(ctx, PX0 - 14, PY0 - 14, PX1 + 14, PY1 + 14, 46, 'rgba(147,197,253,.9)', 3);

  /* left page: the screenshot inside a scanned frame */
  const im = await loadImg(w.img);
  const bx0 = PX0 + 78, bx1 = MID - 70, by0 = PY0 + 84, by1 = PY1 - 128;
  if (im) {
    const k = Math.min((bx1 - bx0) / im.width, (by1 - by0) / im.height);
    const iw = im.width * k, ih = im.height * k, ix = (bx0 + bx1 - iw) / 2, iy = (by0 + by1 - ih) / 2;
    glow(ctx, 'rgba(59,130,246,.55)', 30);
    ctx.fillStyle = '#0b0e18'; ctx.fillRect(ix, iy, iw, ih);
    noGlow(ctx);
    ctx.globalAlpha = .93; ctx.drawImage(im, ix, iy, iw, ih); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(59,130,246,.10)'; ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = 'rgba(2,6,23,.16)';
    for (let y = iy; y < iy + ih; y += 4) ctx.fillRect(ix, y, iw, 1.5);
    ctx.strokeStyle = 'rgba(96,165,250,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(ix, iy, iw, ih);
    brackets(ctx, ix - 10, iy - 10, ix + iw + 10, iy + ih + 10, 26, GREEN, 2.5);
  } else {
    ctx.strokeStyle = 'rgba(96,165,250,.45)'; ctx.setLineDash([10, 9]); ctx.lineWidth = 2;
    ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0); ctx.setLineDash([]);
    ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.font = `400 24px ${MONO}`;
    ctx.fillText('// screenshot coming soon', (bx0 + bx1) / 2, (by0 + by1) / 2);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = GREEN; ctx.font = `400 22px ${MONO}`;
  ctx.fillText('// ' + String(w.cat || 'project').toLowerCase().replace(/\s+/g, '_'), bx0, PY1 - 66);

  /* right page: the readout */
  const tx = MID + 84, tw = PX1 - 80 - tx;
  ctx.fillStyle = GREEN; ctx.font = `400 21px ${MONO}`;
  ctx.fillText(`// ${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, tx, PY0 + 92);
  glow(ctx, 'rgba(59,130,246,.75)', 18);
  ctx.fillStyle = WHITE; ctx.font = `700 74px ${DISPLAY}`;
  const y = drawLines(ctx, wrapLines(ctx, w.title || '', tw), tx, PY0 + 172, 72, 2);
  noGlow(ctx);
  const ul = ctx.createLinearGradient(tx, 0, tx + tw * .7, 0);
  ul.addColorStop(0, BLUE); ul.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = ul; ctx.fillRect(tx, y - 34, tw * .7, 2.5);
  const desc = String(w.desc || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  const tags = String(w.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagRows = chips(ctx, tags, tx, 0, tw, 2, false);
  const tagTop = PY1 - 72 - tagRows * 44;
  ctx.fillStyle = MUTED; ctx.font = `300 26px ${BODY}`;
  const room = Math.max(1, Math.floor((tagTop - 42 - (y + 6)) / 40));
  drawLines(ctx, wrapLines(ctx, desc, tw), tx, y + 14, 40, room);
  if (tags.length) {
    ctx.fillStyle = GREEN; ctx.font = `400 19px ${MONO}`; ctx.fillText('built_with:', tx, tagTop);
    chips(ctx, tags, tx, tagTop + 14, tw, 2, true);
  }
  /* folios */
  ctx.fillStyle = DIM; ctx.font = `400 17px ${MONO}`;
  ctx.fillText(String(i * 2 + 1).padStart(2, '0'), PX0 + 40, PY1 - 30);
  ctx.textAlign = 'right'; ctx.fillText(String(i * 2 + 2).padStart(2, '0'), PX1 - 40, PY1 - 30);

  try {
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', .92));
    return URL.createObjectURL(blob);
  } catch {
    /* a screenshot host without CORS taints the canvas; redraw that page without it */
    return makeSpread({ ...w, img: '' }, i, total);
  }
}

/* ============================== the sketchbook (source code from here) */
window.initSketchbook = async function (works) {
const wrap = document.getElementById('sbWrap');
if (!wrap || !works.length || wrap.dataset.built) return;   /* home re-renders on every visit; build once */
wrap.dataset.built = '1';
await Promise.all([`700 74px ${DISPLAY}`, `300 26px ${BODY}`, `400 19px ${MONO}`]
  .map(f => document.fonts.load(f).catch(() => {})));
const PAGES = works.map(w => ({ id: w._id, title: w.title, place: w.cat || '', url: null }));
const M = PAGES.length, LAND = 0;
/* Drawing and encoding every spread takes seconds, so show the book once the
   first page and its neighbours exist, and draw the rest in the background. */
works.forEach(w => loadImg(w.img));
const build = i => makeSpread(works[i], i, M).then(u => { PAGES[i].url = u; });
const first = [...new Set([0, 1 % M])];
await Promise.all(first.map(build));
const allDrawn = (async () => { for (let i = 0; i < M; i++) if (!first.includes(i)) await build(i); })();

const stage = document.getElementById('sbStage');
const sb3d = document.getElementById('sb3d');
const book = document.getElementById('sbBook');
const capBox = document.getElementById('sbCaptions');
const hint = document.getElementById('sbHint');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let inView = false;

/* ------------------------------------------------ the turning leaf */
const N = 18;            /* strips — enough for a smooth curve          */
const SPAN = 0.449;      /* gutter → outer page edge, as a fraction     */
const BETA = 0.60;       /* peak curl of the arc, radians              */
let idx = 0, turn = null;
let strips = [];

function el(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
function imgEl(i, side) {
  const im = new Image(); im.className = 'sb-half-img ' + side;
  im.draggable = false; im.alt = ''; im.src = PAGES[i].url; return im;
}
function halfEl(pos, i) {
  const d = el('div', 'sb-half ' + pos);
  d.appendChild(imgEl(i, pos));
  d.appendChild(el('div', 'gutter-shade ' + pos));
  return d;
}
function buildCurl(dir, from, to) {
  strips = [];
  const c = el('div', 'curl ' + dir);
  c.style.setProperty('--n', N);
  c.style.setProperty('--span', SPAN);
  let host = c;
  for (let i = 0; i < N; i++) {
    const s = el('div', 'strip');
    s.style.setProperty('--i', i);
    const gut = 'calc(var(--bw) * 0.5)';
    const sw = 'calc(var(--bw) * ' + SPAN + ' / ' + N + ')';
    const A = 'calc(-1 * (' + gut + ' + ' + i + ' * ' + sw + '))';
    const B = 'calc(' + (i + 1) + ' * ' + sw + ' - ' + gut + ')';
    const f = el('div', 'face front'), b = el('div', 'face back');
    const dress = (e, url, px) => { e.style.backgroundImage = 'url(' + url + ')'; e.style.backgroundPositionX = px; };
    dress(f, PAGES[from].url, dir === 'next' ? A : B);
    dress(b, PAGES[to].url, dir === 'next' ? B : A);
    f.appendChild(el('div', 'sh')); f.appendChild(el('div', 'gl'));
    b.appendChild(el('div', 'sh')); b.appendChild(el('div', 'gl'));
    s.appendChild(f); s.appendChild(b);
    if (i === N - 1) s.classList.add('edge');
    host.appendChild(s); host = s;
    strips.push(s);
  }
  return c;
}
function applyTurn(t) {
  const th = Math.PI * t;
  const beta = BETA * Math.sin(Math.PI * t);
  const D = 180 / Math.PI;
  const tt = th + beta, td = 2 * beta / N;
  sb3d.style.setProperty('--tt', (tt * D).toFixed(2) + 'deg');
  sb3d.style.setProperty('--td', (td * D).toFixed(3) + 'deg');
  sb3d.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));
  fadeCaption(t);
  for (let i = 0; i < strips.length; i++) {
    const l1 = Math.abs(Math.cos(tt - i * td));
    const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
    const st = strips[i].style;
    st.setProperty('--lit', l1.toFixed(3));
    st.setProperty('--a1', ((1 - l1) * .62).toFixed(3));
    st.setProperty('--a2', ((1 - l2) * .62).toFixed(3));
  }
}
function paint() {
  book.textContent = '';
  if (!turn) {
    const f = el('div', 'sb-full');
    const im = new Image(); im.src = PAGES[idx].url; im.alt = PAGES[idx].title;
    im.draggable = false;
    f.appendChild(im); book.appendChild(f);
    sb3d.style.setProperty('--shade', '0');
  } else {
    const next = turn.dir === 'next';
    book.appendChild(halfEl('left', next ? turn.from : turn.to));
    book.appendChild(halfEl('right', next ? turn.to : turn.from));
    book.appendChild(buildCurl(turn.dir, turn.from, turn.to));
    applyTurn(turn.t);
  }
  const a = el('button', 'sb-zone sb-prev'), b = el('button', 'sb-zone sb-next');
  a.setAttribute('aria-label', 'previous page'); b.setAttribute('aria-label', 'next page');
  book.appendChild(a); book.appendChild(b);
  layout();
  caption();
  syncZoomLayer();
  placeLoupe();
}
let capOut = null, capIn = null;
function caption() {
  capBox.textContent = '';
  capOut = capIn = null;
  if (turn) {
    capOut = el('p', 'sb-caption live'); capOut.textContent = PAGES[turn.from].title; capBox.appendChild(capOut);
    capIn = el('p', 'sb-caption live'); capIn.textContent = PAGES[turn.to].title; capBox.appendChild(capIn);
    fadeCaption(turn.t);
  } else {
    const p = el('p', 'sb-caption'); p.textContent = PAGES[idx].title; capBox.appendChild(p);
  }
}
function fadeCaption(t) {
  if (!capOut || !capIn) return;
  const out = 1 - Math.max(0, Math.min(1, (t - 0.10) / 0.28));
  const inn = Math.max(0, Math.min(1, (t - 0.56) / 0.30));
  capOut.style.opacity = out.toFixed(3);
  capIn.style.opacity = inn.toFixed(3);
}
function layout() { sb3d.style.setProperty('--bw', book.clientWidth + 'px'); }
addEventListener('resize', layout);

/* ------------------------------------------------------ spring loop */
let spring = null;
function animateTo(target, onDone, stiff, damp) {
  spring = { kind: 'spring', v: 0, target: target, done: onDone, k: stiff || 150, c: damp || 22 };
  kick();
}
function tweenTo(target, dur, onDone) {
  spring = { kind: 'tween', from: turn ? turn.t : 0, target: target, dur: dur, e: 0, done: onDone };
  kick();
}
let raf = null, last = 0;
function tick(now) {
  raf = null;
  const dt = Math.min(0.032, (now - last) / 1000 || 0.016); last = now;
  if (spring && turn) {
    const s = spring;
    if (s.kind === 'tween') {
      s.e += dt;
      const k = Math.min(1, s.e / s.dur);
      turn.t = s.from + (s.target - s.from) * k;
      applyTurn(turn.t);
      if (k >= 1) { spring = null; const d = s.done; d && d(); }
    } else {
      const x = turn.t - s.target;
      s.v += (-s.k * x - s.c * s.v) * dt;
      turn.t += s.v * dt;
      if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
        turn.t = s.target; spring = null;
        applyTurn(turn.t);
        const d = s.done; d && d();
      } else applyTurn(turn.t);
    }
  }
  viewSpring();
  const lmoved = loupeEase();
  if ((spring || viewActive || lmoved) && raf === null) raf = requestAnimationFrame(tick);
}
function kick() { if (raf === null) { last = performance.now(); raf = requestAnimationFrame(tick); } }

/* ------------------------------------------- tilt + zoom of the book */
const TILT_X = 4.5, TILT_Y = 7;
const ZOOM_MIN = 0.9, ZOOM_MAX = 1.5;
const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
let viewActive = false;
let lastZ = 1;
function applyView() {
  sb3d.style.setProperty('--rx', view.rx.toFixed(2) + 'deg');
  sb3d.style.setProperty('--ry', view.ry.toFixed(2) + 'deg');
  sb3d.style.setProperty('--zoom', view.z.toFixed(3));
  if (view.z !== lastZ) { lastZ = view.z; placeLoupe(); }
}
function viewSpring() {
  const e = 0.14;
  let moved = false;
  for (const [k, t] of [['rx', 'trx'], ['ry', 'try_'], ['z', 'tz']]) {
    const d = view[t] - view[k];
    if (Math.abs(d) > 0.0006) { view[k] += d * e; moved = true; }
    else view[k] = view[t];
  }
  if (moved) applyView();
  viewActive = moved;
  return moved;
}
function setView(rx, ry, z) {
  view.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
  view.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
  view.tz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  viewActive = true; kick();
  syncZoom();
}
function tiltTo(cx, cy) {
  if (drag) return;
  const r = book.getBoundingClientRect();
  if (!r.width) return;
  const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.62)));
  const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
  setView(-ny * TILT_X, nx * TILT_Y, view.tz);
}
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || !inView) return;      /* only lean while the book is on screen */
  tiltTo(e.clientX, e.clientY);
}, { passive: true });
addEventListener('pointerout', e => { if (!e.relatedTarget) setView(0, 0, view.tz); });
addEventListener('blur', () => setView(0, 0, view.tz));
stage.addEventListener('dblclick', () => setView(view.trx, view.try_, 1));

/* ------------------------------------------------------- pointer work */
let drag = null;
function bookRect() { return book.getBoundingClientRect(); }
function hideHint() { hint.classList.add('gone'); }

stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  e.preventDefault();
  const onBook = e.target.closest('.sb-zone');
  stage.setPointerCapture(e.pointerId);
  hideHint();
  if (!onBook || introOn) return;
  const r = bookRect();
  const dir = (e.clientX - r.left) / r.width > 0.5 ? 'next' : 'prev';
  startTurn(dir, 0);
  drag = { dir: dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, tPrev: performance.now() };
});
stage.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x0;
  drag.moved = Math.max(drag.moved, Math.abs(dx));
  const raw = (drag.dir === 'next' ? -dx : dx) / (drag.w * 0.62);
  const t = Math.max(0, Math.min(1, raw));
  const now = performance.now();
  drag.vel = (t - (turn ? turn.t : 0)) / Math.max(0.001, (now - drag.tPrev) / 1000);
  drag.tPrev = now;
  if (turn) { turn.t = t; applyTurn(t); }
});
function endDrag() {
  if (!drag) return;
  const d = drag; drag = null;
  if (!turn) return;
  if (d.moved < 6) { commit(); return; }
  const go = turn.t > 0.42 || d.vel > 1.1;
  if (go) commit(); else cancel();
}
stage.addEventListener('dragstart', e => e.preventDefault());
stage.addEventListener('selectstart', e => e.preventDefault());
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

/* ------------------------------------------------------ turn control */
function startTurn(dir, t) {
  spring = null;
  if (turn) { idx = turn.to; turn = null; }
  const from = idx, to = dir === 'next' ? (from + 1) % M : (from - 1 + M) % M;
  if (!PAGES[to].url) return;                    /* that page is still being drawn */
  shoveLoupe(dir);
  turn = { dir: dir, from: from, to: to, t: t || 0 };
  paint();
}
function commit() {
  if (!turn) return;
  if (REDUCED) { idx = turn.to; turn = null; paint(); return; }
  animateTo(1, () => { idx = turn.to; turn = null; paint(); }, 170, 26);
  kick();
}
function cancel() {
  if (!turn) return;
  animateTo(0, () => { turn = null; paint(); }, 150, 24);
  kick();
}
function step(dir) {
  if (introOn) endIntro();
  if (turn) { idx = turn.to; turn = null; }
  startTurn(dir, 0); commit();
}
document.getElementById('sbLeft').onclick = () => step('prev');
document.getElementById('sbRight').onclick = () => step('next');
document.getElementById('sbOpen').onclick = () => openModal(PAGES[turn ? turn.to : idx].id);
addEventListener('keydown', e => {
  if (!inView) return;                                     /* arrow keys belong to the page elsewhere */
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (document.querySelector('#workModal.active')) return;               /* the project popup is open */
  e.preventDefault(); hideHint();
  step(e.key === 'ArrowRight' ? 'next' : 'prev');
});

/* --------------------------------------------------- loupe + controls */
const loupe = document.getElementById('loupe');
const zRead = document.getElementById('zRead');
const loupeBtn = document.getElementById('loupeBtn');
const zInBtn = document.getElementById('zIn'), zOutBtn = document.getElementById('zOut');
const MAG = 2.3;
let loupeOn = true, lx = null, ly = null, lgrab = null, lTarget = null;

function loupeSize() { return Math.round(Math.max(165, Math.min(262, book.clientWidth * 0.235))); }
function bookBox() { return { x: 0, y: 0, w: book.clientWidth, h: book.clientHeight }; }
function restLoupe() {
  const b = bookBox();
  lx = b.x + b.w * 0.88; ly = b.y + b.h * 0.855;
  placeLoupe();
}
const zoomWrap = document.getElementById('zoomWrap');
const zoomInner = document.getElementById('zoomInner');
function syncZoomLayer() {
  zoomInner.textContent = '';
  for (const c of book.children) {
    if (c.classList.contains('sb-zone')) continue;
    zoomInner.appendChild(c.cloneNode(true));
  }
}
function placeLoupe() {
  if (lx === null) return;
  const B = bookBox(), bw = B.w, bh = B.h;
  if (!bw) return;
  const R = loupeSize() / 2, bez = R * 2 * 0.058;
  loupe.style.setProperty('--lr', R * 2 + 'px');
  loupe.style.transform = 'translate3d(' + (lx - R).toFixed(1) + 'px,' + (ly - R).toFixed(1) + 'px,0)';
  if (loupeOn) loupe.classList.add('on');
  const z = view.z, cx = bw / 2, cy = bh / 2;
  const x0 = cx + (bw * .051 - cx) * z, x1 = cx + (bw * .949 - cx) * z;
  const y0 = cy + (bh * .218 - cy) * z, y1 = cy + (bh * .782 - cy) * z;
  const nx = Math.max(x0, Math.min(lx, x1));
  const ny = Math.max(y0, Math.min(ly, y1));
  const inside = (lx > x0 && lx < x1 && ly > y0 && ly < y1)
    ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
    : -Math.hypot(lx - nx, ly - ny);
  const k = Math.max(0, Math.min(1, (inside + R * 0.30) / (R * 0.55)));
  zoomWrap.style.opacity = (loupeOn ? k : 0).toFixed(3);
  if (k <= 0.002) return;
  const r = (R - bez).toFixed(1);
  const mask = 'radial-gradient(circle ' + r + 'px at ' + lx.toFixed(1) + 'px ' + ly.toFixed(1) + 'px,'
    + '#000 calc(100% - 1px),transparent 100%)';
  zoomWrap.style.webkitMaskImage = mask;
  zoomWrap.style.maskImage = mask;
  const px = cx + (lx - cx) / z, py = cy + (ly - cy) / z, s = MAG * z;
  zoomInner.style.transform = 'translate(' + (lx - px * s).toFixed(1) + 'px,' + (ly - py * s).toFixed(1) + 'px) '
    + 'scale(' + s.toFixed(4) + ')';
}
function shoveLoupe(dir) {
  if (!loupeOn || lx === null || lgrab) return;
  const b = bookBox();
  const nx = (b.w / 2 + (lx - b.x - b.w / 2) / view.z) / b.w, ny = (b.h / 2 + (ly - b.y - b.h / 2) / view.z) / b.h;
  if (nx < 0.02 || nx > 0.98 || ny < 0.17 || ny > 0.83) return;
  lTarget = { x: b.x + b.w * (dir === 'next' ? 0.12 : 0.88), y: b.y + b.h * 0.855 };
  kick();
}
function loupeEase() {
  if (!lTarget) return false;
  if (lgrab) { lTarget = null; return false; }
  const dx = lTarget.x - lx, dy = lTarget.y - ly;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { lx = lTarget.x; ly = lTarget.y; lTarget = null; placeLoupe(); return false; }
  lx += dx * 0.17; ly += dy * 0.17; placeLoupe();
  return true;
}
loupe.addEventListener('pointerdown', e => {
  if (!loupeOn || e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  lTarget = null;
  lgrab = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
  loupe.classList.add('held');
  loupe.setPointerCapture(e.pointerId);
  hideHint();
});
loupe.addEventListener('pointermove', e => {
  if (!lgrab) return;
  const b = bookBox(), R = loupeSize() / 2;
  lx = Math.max(b.x - R * 0.7, Math.min(b.x + b.w + R * 0.7, lgrab.lx0 + (e.clientX - lgrab.cx)));
  ly = Math.max(b.y - R * 0.7, Math.min(b.y + b.h + R * 1.0, lgrab.ly0 + (e.clientY - lgrab.cy)));
  placeLoupe();
});
function dropLoupe() { lgrab = null; loupe.classList.remove('held'); }
loupe.addEventListener('pointerup', dropLoupe);
loupe.addEventListener('pointercancel', dropLoupe);
loupeBtn.onclick = () => {
  loupeOn = !loupeOn;
  loupeBtn.setAttribute('aria-pressed', String(loupeOn));
  loupe.classList.toggle('on', loupeOn);
  if (loupeOn && lx === null) restLoupe();
  placeLoupe();
};
addEventListener('resize', () => { lx = null; restLoupe(); });

function syncZoom() {
  zRead.textContent = Math.round(view.tz * 100) + '%';
  zOutBtn.disabled = view.tz <= ZOOM_MIN + 0.001;
  zInBtn.disabled = view.tz >= ZOOM_MAX - 0.001;
}
zInBtn.onclick = () => { setView(view.trx, view.try_, view.tz * 1.16); hideHint(); };
zOutBtn.onclick = () => { setView(view.trx, view.try_, view.tz / 1.16); hideHint(); };

/* ---------------------------------------------------------- the riffle */
let riffle = null, riffleAt = 0, introOn = false;
function endIntro() { introOn = false; wrap.classList.remove('intro', 'b2'); }
function riffleStep() {
  const s = riffle[riffleAt];
  wrap.classList.toggle('b2', s.bell > 0.55);
  startTurn('next', 0);
  tweenTo(1, s.dur, () => {
    idx = turn.to; turn = null;
    riffleAt++;
    if (introOn && riffleAt < riffle.length) { paint(); riffleStep(); }
    else { endIntro(); paint(); }
  });
}
function startIntro() {
  const coarse = matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  if (coarse || REDUCED || M < 2) { idx = LAND; paint(); return; }
  const steps = M + LAND;
  riffle = [];
  for (let r = 0; r < steps; r++) {
    const bell = Math.sin(Math.PI * (r / (steps - 1)));
    riffle.push({ bell: bell, dur: 0.26 - 0.19 * bell });
  }
  riffleAt = 0; introOn = true; wrap.classList.add('intro');
  riffleStep();
}

/* ------------------------------------------------------------- boot */
idx = 0;
paint(); applyView();
syncZoom(); restLoupe();
wrap.classList.add('ready');
/* the riffle plays once, the first time the book comes into view */
let played = false;
new IntersectionObserver(([e]) => {
  inView = e.isIntersecting;
  if (!inView) { setView(0, 0, view.tz); return; }
  if (!played) { played = true; allDrawn.then(() => setTimeout(startIntro, 220)); }
}, { threshold: 0.35 }).observe(stage);
};
})();
