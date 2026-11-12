// Pure camera math for the 3D hero (no Three.js), tested by tests/hero3d-math.test.mjs.
export const REST = { pos: [2.5, 1.75, 3.1], target: [-0.75, 0.95, -0.55] };
export const SCREEN = { pos: [0.34, 1.15, -0.35], target: [0.42, 1.15, -1.2] };
export const PARALLAX = 0.35;

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
  if (k) { pos[0] += mx * k; pos[1] += my * k; }
  return { pos, target };
}

export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}
