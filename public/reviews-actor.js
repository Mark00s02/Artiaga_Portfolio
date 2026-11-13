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
const MID = 0.9;          // pitch pivot height (about his waist)

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
    // rig: position + pitch (pivot at mid-body so he tilts like a flyer, not like a falling post)
    const rig = new THREE.Group(), yawG = new THREE.Group();
    yawG.position.y = -MID; yawG.add(man); rig.add(yawG); rig.visible = false; scene.add(rig);
    const fbx = new FBXLoader();
    const clips = {}, actions = {}, lead = {};
    const has = n => !!actions[n];
    const mixer = new THREE.AnimationMixer(man);
    const sampler = new THREE.AnimationMixer(man); // measurements don't disturb what's playing
    const hips = (() => { let b = null; man.traverse(o => { if (!b && o.isBone && o.name.endsWith('Hips')) b = o; }); return b; })();
    const hipsY = clip => { // hip height (world units) at the clip's first frame
      const a = sampler.clipAction(clip); a.reset().play(); a.time = 0; sampler.update(0);
      const y = man.worldToLocal(hips.getWorldPosition(new THREE.Vector3())).y * SCALE; a.stop(); return y;
    };
    let standHips = 0.95; // upright hip height, measured from Walking when it arrives
    const addAction = (n, c) => {
      const a = mixer.clipAction(c);
      if (ONCE.has(n)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      actions[n] = a;
    };
    function addClip(n, clip) {
      clips[n] = inPlace(clip);
      if (n === 'walking') standHips = hipsY(clips[n]);
      // landing clips start in the air: begin them this far above the floor
      if (n === 'land' || n === 'flatImpact') lead[n] = Math.max(0, hipsY(clips[n]) - standHips);
      addAction(n, clips[n]);
      if (n === 'stand') addAction('standStill', clips.stand.clone()); // 'Stand' is a get-up move; its last frame is our still pose
    }
    // One clip at a time (parallel downloads stall the page's own requests). Entrance clips first.
    const first = ['falling', 'walking', 'land', 'stand', 'greeting'];
    const order = [...first, ...Object.keys(files).filter(n => !first.includes(n))].filter(n => files[n]);
    const loaded = {};
    let chain = Promise.resolve();
    for (const n of order) {
      loaded[n] = chain = chain
        .then(() => fbx.loadAsync(files[n]))
        .then(f => { if (f.animations[0]) addClip(n, f.animations[0]); })
        .catch(() => {}); // a missing clip just isn't used
    }
    const entranceReady = loaded.greeting || chain;

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
    let current = null, gen = 0, facing = 0, faceT = 0, pitch = 0, pitchT = 0;
    const pos = new THREE.Vector3(), vel = { y: 0 };
    let move = null;      // { x, y, speed, resolve }
    let gravity = false;

    function play(name, fade = 0.35) {
      const next = actions[name];
      if (!next) return Promise.resolve();
      next.reset().play();
      if (name === 'standStill') { next.time = next.getClip().duration; next.paused = true; } // hold the final frame
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
    const faceTo = x => { faceT = Math.sign(x - pos.x) * (Math.PI / 2 - FACE); pitchT = 0; };
    const faceViewer = () => { faceT = 0; pitchT = 0; };
    // head-first travel (flying, swimming): side-on toward the target, nose tilted along the path
    const headFirst = (x, y) => {
      const dx = x - pos.x || 0.001, dy = y - pos.y, sx = Math.sign(dx);
      faceT = sx * Math.PI / 2;
      pitchT = sx * THREE.MathUtils.clamp(Math.atan2(dy, Math.abs(dx)), -0.7, 0.7);
    };
    const flyTo = (x, y, speed, g) => { headFirst(x, y); return moveTo(x, y, speed, g); };
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
        if (flat) {
          await play('fallenIdle'); guard(g); await wait(1.2, g); await play('standUp'); guard(g);
          if (has('injuredWalk')) { const x = THREE.MathUtils.clamp(pos.x + rnd(-1.5, 1.5), -W / 2 + 1, W / 2 - 1); faceTo(x); play('injuredWalk'); await moveTo(x, floorY(), 0.6, g); }
        }
      } else {
        while (pos.y > floorY()) await wait(0.02, g);
        gravity = false; vel.y = 0; pos.y = floorY();
      }
    }

    const idle = async (g, t = rnd(0.8, 1.6)) => { if (has('standStill')) { faceViewer(); play('standStill', 0.4); await wait(t, g); } };
    const takeOff = async g => { // a hop into the air, flying starts at the top of it
      if (has('jump')) { play('jump', 0.2); await wait(0.45, g); }
    };
    const descend = async g => { // float down and land
      faceViewer(); play(has('floating') ? 'floating' : 'treading');
      await moveTo(pos.x, floorY() + 1.2, 0.9, g);
      gravity = true; await land(g);
    };
    const sequences = [
      // stroll somewhere and look around
      [3, ['walking'], async g => { const x = farX(); faceTo(x); play('walking'); await moveTo(x, floorY(), 1.1, g); }],
      // sprint across; going too fast at the end sometimes makes him trip, then he gets up
      [2, ['running'], async g => {
        const x = farX(); faceTo(x); play('running'); await moveTo(x, floorY(), 3.2, g);
        if (has('trip') && has('standUp') && Math.random() < 0.35) {
          await play('trip', 0.15); if (has('fallenIdle')) { play('fallenIdle'); await wait(0.8, g); }
          await play('standUp');
        }
      }],
      // workout, then a victory pose to the viewer
      [1, ['jumpingJacks'], async g => {
        faceViewer(); play('jumpingJacks'); await wait(rnd(2.5, 3.5), g);
        if (has('pose')) { play('pose', 0.3); await wait(1.4, g); }
      }],
      // jump, fly up and across, float back down
      [2, ['flying'], async g => {
        const x1 = farX(), y1 = airY();
        faceTo(x1); await wait(0.3, g); await takeOff(g);
        play('flying', 0.3); await flyTo(x1, y1, 2.4, g);
        const x2 = farX(); await flyTo(x2, airY(), 2.4, g);
        await descend(g);
      }],
      // fly up into the "water", tread, swim across, tread, float down
      [2, ['flying', 'swimming', 'treading'], async g => {
        const y = airY(), x1 = THREE.MathUtils.clamp(pos.x + rnd(-1.5, 1.5), -W / 2 + 1, W / 2 - 1);
        faceTo(x1); await wait(0.3, g); await takeOff(g);
        play('flying', 0.3); await flyTo(x1, y, 2.2, g);
        faceViewer(); play('treading', 0.5); await wait(rnd(1.2, 2), g);
        const x2 = farX(); play('swimming', 0.5); await flyTo(x2, y + rnd(-0.3, 0.3), 1.2, g);
        faceViewer(); play('treading', 0.5); await wait(rnd(1.2, 2), g);
        await descend(g);
      }],
      // say hi now and then
      [1, ['greeting'], async g => { faceViewer(); await play('greeting'); }],
    ];

    async function roam(g) {
      // fall in from above the top edge, land, then say hi
      await entranceReady; guard(g);
      pos.set(rnd(-W * 0.3, W * 0.3), H / 2 + 1.5, 0); vel.y = 0; move = null; facing = faceT = pitch = pitchT = 0;
      rig.visible = true; shadow.visible = true;
      play(has('falling') ? 'falling' : 'pose', 0); gravity = true;
      await land(g);
      if (has('greeting')) { faceViewer(); await play('greeting'); }
      let last = null;
      for (;;) {
        await idle(g);
        const pool = sequences.filter(q => q !== last && q[1].every(has)); // only loaded ones; never the same twice in a row
        if (!pool.length) { await wait(2, g); continue; }
        let r = Math.random() * pool.reduce((t, [w]) => t + w, 0), q = pool[0];
        for (const c of pool) { if ((r -= c[0]) <= 0) { q = c; break; } }
        last = q; await q[2](g);
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
      facing = damp(facing, faceT, 6, dt); pitch = damp(pitch, pitchT, 4, dt);
      rig.position.set(pos.x, pos.y + MID, pos.z); rig.rotation.z = pitch; yawG.rotation.y = facing;
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
