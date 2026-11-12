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

import { solveTwoBone } from '../public/hero3d-math.js';
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('solveTwoBone reaches a reachable target with correct bone lengths', () => {
  const { elbow, hand } = solveTwoBone([0, 0, 0], [0.3, -0.2, -0.1], 0.26, 0.25, [1, -1, 0]);
  assert.deepEqual(hand, [0.3, -0.2, -0.1]);
  near(dist([0, 0, 0], elbow), 0.26, 1e-6);
  near(dist(elbow, hand), 0.25, 1e-6);
});

test('solveTwoBone bends the elbow toward the pole', () => {
  const { elbow } = solveTwoBone([0, 0, 0], [0, -0.4, 0], 0.26, 0.25, [1, 0, 0]);
  assert.ok(elbow[0] > 0.05, `elbow x ${elbow[0]}`);
});

test('solveTwoBone clamps an out-of-reach target onto the reach sphere', () => {
  const { elbow, hand } = solveTwoBone([0, 0, 0], [2, 0, 0], 0.26, 0.25, [0, -1, 0]);
  near(dist([0, 0, 0], hand), 0.51, 1e-3);
  near(dist([0, 0, 0], elbow), 0.26, 1e-6);
  near(dist(elbow, hand), 0.25, 1e-6);
});

import { ARC } from '../public/hero3d-math.js';
test('dolly arcs upward mid-way (over the character) but keeps exact endpoints', () => {
  const mid = cameraPose(0, 0, 0.5, false).pos[1];
  const straight = (REST.pos[1] + SCREEN.pos[1]) / 2;
  near(mid - straight, ARC, 1e-9);
  assert.deepEqual(cameraPose(0, 0, 1, false).pos, SCREEN.pos);
});
