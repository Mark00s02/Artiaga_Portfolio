// reviews-actor.js — when "What they say" scrolls into view the character falls in from the top of the
// section, lands, then roams the box: walks, runs, jumps, greets, flies, swims, treads water, floats.
// Every clip is optional; activities whose clips are missing are simply skipped.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadCharacterModel } from './actor.js';
import { damp } from './hero3d-math.js';

const H = 7;              // world units spanning the section's height
const SCALE = 0.0125;     // ~1.8 units tall, about a quarter of the box
const FACE = 0.35;        // when walking sideways, turn this much toward the viewer

export function initReviewsActor({ section, modelUrl, texture, clips: files }) {
  if (!section || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'reviews-actor'; canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);

  let started = false;
  // start loading a little before the section arrives
  const pre = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || started) return;
    started = true; pre.disconnect();
    start().catch(err => { console.info('Reviews character disabled:', err?.message || err); canvas.remove(); });
  }, { rootMargin: '600px 0px' });
  pre.observe(section);

  async function start() {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#dfe6ff', '#2a2420', 1.6));
    const key = new THREE.DirectionalLight('#ffffff', 1.8); key.position.set(2, 4, 6); scene.add(key);
    const rimL = new THREE.DirectionalLight('#5b8cff', 1.2); rimL.position.set(-4, 2, -3); scene.add(rimL);

    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
    camera.position.set(0, 0, (H / 2) / Math.tan(THREE.MathUtils.degToRad(11)));
    camera.lookAt(0, 0, 0);
    let W = H;
    const floorY = () => -H / 2 + 0.3;
    const resize = () => {
      const w = section.clientWidth, h = section.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); W = H * camera.aspect;
    };
    new ResizeObserver(resize).observe(section); resize();

    // ---- character + clips ----
    const man = await loadCharacterModel(modelUrl, texture);
    man.scale.setScalar(SCALE);
    const rig = new THREE.Group(); rig.add(man); rig.visible = false; scene.add(rig);
    const fbx = new FBXLoader();
    const names = Object.keys(files);
    const loaded = await Promise.allSettled(names.map(n => fbx.loadAsync(files[n])));
    const clips = {};
    loaded.forEach((r, i) => { if (r.status === 'fulfilled' && r.value.animations[0]) clips[names[i]] = inPlace(r.value.animations[0]); });
    const has = n => !!clips[n];

    const mixer = new THREE.AnimationMixer(man);
    const hips = (() => { let b = null; man.traverse(o => { if (!b && o.isBone && o.name.endsWith('Hips')) b = o; }); return b; })();
    const hipsY = clip => { // hip height (world units) at the clip's first frame
      const a = mixer.clipAction(clip); a.reset().play(); a.time = 0; mixer.update(0);
      const y = man.worldToLocal(hips.getWorldPosition(new THREE.Vector3())).y * SCALE; a.stop(); return y;
    };
    const standHips = has('idle') ? hipsY(clips.idle) : 0.95;
    // landing clips start in the air: begin them this far above the floor
    const lead = Object.fromEntries(['land', 'flatImpact'].filter(has).map(n => [n, Math.max(0, hipsY(clips[n]) - standHips)]));

    const actions = {};
    for (const [n, c] of Object.entries(clips)) {
      const a = mixer.clipAction(c);
      if (ONCE.has(n)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      actions[n] = a;
    }

    // soft contact shadow
    const shadowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.visible = false; scene.add(shadow);

    // ---- motion state ----
    let current = null, gen = 0, facing = 0, faceT = 0;
    const pos = new THREE.Vector3(), vel = { y: 0 };
    let move = null;      // { x, y, speed, resolve }
    let gravity = false;

    function play(name, fade = 0.35) {
      const next = actions[name];
      if (!next) return Promise.resolve();
      next.reset().play();
      if (current && current !== next) current.crossFadeTo(next, fade, false);
      current = next;
      if (!ONCE.has(name)) return Promise.resolve();
      return new Promise(res => {
        const done = e => { if (e.action === next) { mixer.removeEventListener('finished', done); res(); } };
        mixer.addEventListener('finished', done);
      });
    }
    const CANCEL = Symbol('cancel');
    const guard = g => { if (g !== gen) throw CANCEL; };
    const wait = (s, g) => new Promise(r => setTimeout(r, s * 1000)).then(() => guard(g));
    const moveTo = (x, y, speed, g) => new Promise(res => { move = { x, y, speed, res }; }).then(() => guard(g));
    const faceTo = x => { faceT = Math.sign(x - pos.x) * (Math.PI / 2 - FACE); };
    const faceViewer = () => { faceT = 0; };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[(Math.random() * arr.length) | 0];
    const xIn = () => rnd(-W / 2 + 1, W / 2 - 1);
    const farX = () => { let x; do { x = xIn(); } while (Math.abs(x - pos.x) < W * 0.25); return x; };
    const airY = () => rnd(floorY() + 1.6, H / 2 - 2.2);

    async function land(g) { // finish a descent: impact clip from just above the floor
      const flat = has('flatImpact') && has('fallenIdle') && has('standUp') && Math.random() < 0.3;
      const name = flat ? 'flatImpact' : (has('land') ? 'land' : null);
      if (name) {
        while (pos.y > floorY() + (lead[name] || 0)) await wait(0.02, g);
        gravity = false; vel.y = 0; pos.y = floorY();
        faceViewer(); await play(name, 0.15); guard(g);
        if (flat) { await play('fallenIdle'); guard(g); await wait(1.2, g); await play('standUp'); guard(g); }
      } else {
        while (pos.y > floorY()) await wait(0.02, g);
        gravity = false; vel.y = 0; pos.y = floorY();
      }
    }

    const activities = [
      [3, ['walking'], async g => { faceTo(pos.x); const x = farX(); faceTo(x); play('walking'); await moveTo(x, floorY(), 1.1, g); }],
      [2, ['running'], async g => { const x = farX(); faceTo(x); play('running'); await moveTo(x, floorY(), 3.2, g); }],
      [1, ['injuredWalk'], async g => { const x = farX(); faceTo(x); play('injuredWalk'); await moveTo(x, floorY(), 0.6, g); }],
      [2, ['jump'], async g => { faceViewer(); await play('jump'); }],
      [1, ['jumpingJacks'], async g => { faceViewer(); play('jumpingJacks'); await wait(rnd(2.5, 4), g); }],
      [2, ['greeting'], async g => { faceViewer(); await play('greeting'); }],
      [1, ['pose'], async g => { faceViewer(); play('pose', 0.25); await wait(1.6, g); }],
      [1, ['trip', 'fallenIdle', 'standUp'], async g => {
        const x = farX(); faceTo(x); play('walking'); await moveTo((pos.x + x) / 2, floorY(), 1.1, g);
        await play('trip'); await play('fallenIdle'); await wait(1, g); await play('standUp');
      }],
      [2, ['flying', 'floating'], async g => {
        const x = farX(); faceTo(x); play('flying'); await moveTo(x, airY(), 2.4, g);
        await moveTo(farX(), airY(), 2.4, g);
        play('floating'); faceViewer(); await moveTo(pos.x, floorY() + 1.2, 0.9, g);
        gravity = true; await land(g);
      }],
      [2, ['swimming', 'treading'], async g => {
        faceViewer(); play('treading'); await moveTo(pos.x, airY(), 0.9, g);
        const x = farX(); faceTo(x); play('swimming'); await moveTo(x, pos.y + rnd(-0.4, 0.4), 1.2, g);
        faceViewer(); play('treading'); await wait(rnd(1.5, 2.5), g);
        play(has('floating') ? 'floating' : 'treading'); await moveTo(pos.x, floorY() + 1.2, 0.8, g);
        gravity = true; await land(g);
      }],
      [1, ['floating'], async g => {
        faceViewer(); play('floating'); await moveTo(pos.x + rnd(-1, 1), floorY() + rnd(1, 2), 0.5, g);
        await wait(1.5, g); gravity = true; await land(g);
      }],
    ].filter(([, need]) => need.every(has));

    async function roam(g) {
      // fall in from above the top edge
      pos.set(rnd(-W * 0.3, W * 0.3), H / 2 + 1.5, 0); vel.y = 0; move = null; facing = faceT = 0;
      rig.visible = true; shadow.visible = true;
      play(has('falling') ? 'falling' : 'pose', 0); gravity = true;
      await land(g);
      for (;;) {
        if (has('idle')) { faceViewer(); play('idle'); await wait(rnd(0.8, 2), g); }
        const total = activities.reduce((s, [w]) => s + w, 0);
        let r = Math.random() * total, act = activities[0];
        for (const a of activities) { if ((r -= a[0]) <= 0) { act = a; break; } }
        if (!act) { await wait(2, g); continue; }
        await act[2](g);
      }
    }
    const begin = () => { const g = ++gen; roam(g).catch(e => { if (e !== CANCEL) console.info('reviews actor:', e); }); };

    // ---- loop: only while the section is on screen ----
    let raf = 0, visible = false;
    const clock = new THREE.Clock();
    function tick() {
      const should = visible && !document.hidden;
      if (should && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
      if (!should) { cancelAnimationFrame(raf); raf = 0; }
    }
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.1);
      if (gravity) { vel.y -= 14 * dt; pos.y += vel.y * dt; }
      if (move) {
        const d = new THREE.Vector2(move.x - pos.x, move.y - pos.y), len = d.length(), step = move.speed * dt;
        if (len <= step) { pos.x = move.x; pos.y = move.y; const r = move.res; move = null; r(); }
        else { pos.x += (d.x / len) * step; pos.y += (d.y / len) * step; }
      }
      facing = damp(facing, faceT, 6, dt);
      rig.position.copy(pos); rig.rotation.y = facing;
      const alt = Math.max(0, pos.y - floorY());
      shadow.position.set(pos.x, floorY() + 0.01, 0); shadow.rotation.x = -Math.PI / 2 + 0.25;
      shadow.material.opacity = Math.max(0.08, 1 - alt / 3); shadow.scale.setScalar(Math.max(0.5, 1 - alt / 6));
      mixer.update(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting; tick();
      if (visible && !was) begin();                           // fall in every time the section arrives
      if (!visible && was) { gen++; rig.visible = shadow.visible = false; move = null; gravity = false; }
    }, { threshold: 0.3 }).observe(section);
    document.addEventListener('visibilitychange', tick);
  }
}

// clips that play once (the rest loop)
const ONCE = new Set(['land', 'flatImpact', 'standUp', 'jump', 'greeting', 'trip']);

// Mixamo locomotion moves the hips forward; we move him ourselves, so keep only the vertical bob.
function inPlace(clip) {
  for (const t of clip.tracks) {
    if (!/Hips\.position$/.test(t.name)) continue;
    const v = t.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  return clip;
}
