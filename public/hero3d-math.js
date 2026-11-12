// Pure camera math for the 3D hero (no Three.js), tested by tests/hero3d-math.test.mjs.
export const REST = { pos: [2.5, 1.75, 3.1], target: [-0.75, 0.95, -0.55] };
export const SCREEN = { pos: [0.34, 1.15, -0.35], target: [0.42, 1.15, -1.2] };
export const PARALLAX = 0.35;
export const ARC = 0.45; // dolly lifts this high mid-way so it passes over the character, not through him

const clamp01 = v => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a * (1 - t) + b * t; // exact at t=0 and t=1
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function scrollProgress(scrollY, heroHeight) {
  return heroHeight > 0 ? clamp01(scrollY / heroHeight) : 0;
}

export function cameraPose(mx, my, progress, reduced) {
  if (reduced) { mx = 0; my = 0; progress = 0; }
  const t = easeInOutCubic(clamp01(progress));
  const k = PARALLAX * (1 - t);
  const pos = REST.pos.map((v, i) => lerp(v, SCREEN.pos[i], t));
  const target = REST.target.map((v, i) => lerp(v, SCREEN.target[i], t));
  pos[1] += 4 * t * (1 - t) * ARC; // exactly 0 at both ends
  if (k) { pos[0] += mx * k; pos[1] += my * k; }
  return { pos, target };
}

export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

// Two-bone IK (shoulder->elbow->wrist). Arrays of [x,y,z]; elbow bends toward `pole`.
export function solveTwoBone(s, t, l1, l2, pole) {
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const d = sub(t, s), len = Math.hypot(...d) || 1e-6;
  const dir = d.map(v => v / len);
  const reach = Math.min(Math.max(len, Math.abs(l1 - l2) + 1e-4), l1 + l2 - 1e-4);
  const hand = reach === len ? t.slice() : s.map((v, i) => v + dir[i] * reach);
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let p = sub(pole, dir.map(v => v * dot(pole, dir)));
  const pl = Math.hypot(...p);
  p = pl > 1e-6 ? p.map(v => v / pl) : [0, -1, 0];
  const elbow = s.map((v, i) => v + dir[i] * a + p[i] * h);
  return { elbow, hand };
}
