import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollProgress, cameraPose, damp, REST, SCREEN } from '../public/hero3d-math.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('scrollProgress clamps to 0..1', () => {
  assert.equal(scrollProgress(-10, 800), 0);
  assert.equal(scrollProgress(400, 800), 0.5);
  assert.equal(scrollProgress(5000, 800), 1);
  assert.equal(scrollProgress(100, 0), 0);
});

test('cameraPose endpoints', () => {
  assert.deepEqual(cameraPose(0, 0, 0, false).pos, REST.pos);
  assert.deepEqual(cameraPose(0, 0, 1, false).pos, SCREEN.pos);
  assert.deepEqual(cameraPose(0, 0, 1, false).target, SCREEN.target);
});

test('parallax offset applies at rest and vanishes at the screen', () => {
  near(cameraPose(1, 0, 0, false).pos[0] - REST.pos[0], 0.35);
  assert.deepEqual(cameraPose(1, 0, 1, false).pos, SCREEN.pos);
});

test('reduced motion ignores mouse and scroll', () => {
  assert.deepEqual(cameraPose(1, 1, 0.7, true), cameraPose(0, 0, 0, false));
});

test('damp is frame-rate independent ease', () => {
  assert.equal(damp(0, 10, 5, 0), 0);
  near(damp(0, 10, 5, 1000), 10);
});
