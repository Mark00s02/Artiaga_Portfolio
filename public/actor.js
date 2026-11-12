// actor.js — the rigged Mixamo character: fits him to the desk and chains the seated clips.
// Every clip is measured on load (hip and hand positions), so swapping a clip needs no number changes.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { damp } from './hero3d-math.js';

// ~1.65 m tall: with his hands on the 79 cm desk this puts his hips on the 55 cm chair cushion.
const SCALE = 0.0115;
const CHAIR_FROM_HIPS = 0.04; // chair origin sits this far behind the hips (world +Z)

export async function loadActor({ scene, files, texture, chair, keyboard, reduced }) {
  const fbx = new FBXLoader();
  const man = await fbx.loadAsync(files.typing);

  // Mixamo bakes a path from its own server into the FBX, and the OBJ we uploaded had no normals.
  const skinTex = await new THREE.TextureLoader().loadAsync(texture).catch(() => null);
  if (skinTex) skinTex.colorSpace = THREE.SRGBColorSpace;
  man.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
    o.geometry.computeVertexNormals();
    if (skinTex) o.material = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.85, metalness: 0 });
  });

  const rig = new THREE.Group();          // world placement: slide back from the desk / swivel
  rig.rotation.y = Math.PI;               // Mixamo faces +Z; the desk is at -Z
  rig.add(man); scene.add(rig);
  man.scale.setScalar(SCALE);

  const bone = suffix => { let b = null; man.traverse(o => { if (!b && o.isBone && o.name.endsWith(suffix)) b = o; }); return b; };
  const hips = bone('Hips'), hands = [bone('LeftHand'), bone('RightHand')];
  const mixer = new THREE.AnimationMixer(man);
  const local = b => man.worldToLocal(b.getWorldPosition(new THREE.Vector3()));
  const sample = (clip, t) => {
    const a = mixer.clipAction(clip); a.reset().play(); a.time = t; mixer.update(0);
    man.updateMatrixWorld(true);
    const r = { hips: local(hips), hands: hands.map(local) };
    a.stop(); return r;
  };

  // ---- clips ----
  const clips = { typing: man.animations[0] };
  const extra = Object.entries(files).filter(([k]) => k !== 'typing');
  (await Promise.allSettled(extra.map(([, url]) => fbx.loadAsync(url))))
    .forEach((r, i) => { if (r.status === 'fulfilled' && r.value.animations[0]) clips[extra[i][0]] = r.value.animations[0]; });

  // ---- fit: hands on the keyboard, chair under the hips ----
  rig.updateMatrixWorld(true); // apply the 180° turn before measuring in world space
  const type0 = sample(clips.typing, 0);
  const handsWorld = type0.hands.map(h => man.localToWorld(h.clone())).reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(0.5);
  const target = new THREE.Vector3(keyboard.x, keyboard.y + 0.04, keyboard.z + 0.07); // wrists just behind the keys
  rig.position.add(target.sub(handsWorld));
  rig.updateMatrixWorld(true);
  const base = rig.position.clone();
  const hipsWorld = man.localToWorld(type0.hips.clone());
  const chairBase = chair ? { z: hipsWorld.z + CHAIR_FROM_HIPS, ry: chair.rotation.y } : null;
  if (chair) chair.position.z = chairBase.z;

  // per-clip hip offset (model units) so every seated clip sits where Typing sits,
  // and Stand-to-Sit starts exactly where Sit-to-Stand ended
  const offsets = {};
  for (const [name, clip] of Object.entries(clips)) {
    const start = sample(clip, 0).hips;
    if (name === 'sitToStand') offsets[name] = new THREE.Vector3();
    else if (name === 'standToSit' && clips.sitToStand) offsets[name] = sample(clips.sitToStand, clips.sitToStand.duration - 0.01).hips.sub(start).setX(0);
    else offsets[name] = type0.hips.clone().sub(start).setX(0);
  }

  const actions = {};
  for (const [name, clip] of Object.entries(clips)) {
    const a = mixer.clipAction(clip);
    if (name !== 'typing') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    actions[name] = a;
  }

  // ---- director ----
  let current = null;
  const offset = new THREE.Vector3(), offsetTarget = new THREE.Vector3();
  let slide = 0, slideT = 0, swivel = 0, swivelT = 0;

  function play(name, fade = 0.5) {
    const next = actions[name];
    if (!next) return Promise.resolve();
    next.reset().play();
    if (current && current !== next) current.crossFadeTo(next, fade, false);
    current = next; offsetTarget.copy(offsets[name]);
    if (name === 'typing') return Promise.resolve();
    return new Promise(res => {
      const done = e => { if (e.action === next) { mixer.removeEventListener('finished', done); res(); } };
      mixer.addEventListener('finished', done);
    });
  }
  const wait = s => new Promise(r => setTimeout(r, s * 1000));

  async function greet() { // swivel the chair toward the visitor and cheer
    slideT = 0.36; swivelT = -1.3;
    await wait(0.5);
    await play('cheer');
    swivelT = 0; slideT = 0;
    play('typing', 0.6);
    await wait(1.2);
  }
  async function standBreak() { // push the chair back, stand, sit back down, scoot in
    slideT = 0.38;
    await wait(0.6);
    await play('sitToStand', 0.4);
    await play('standToSit', 0.3);
    play('typing', 0.6); slideT = 0;
    await wait(1);
  }
  async function direct() {
    play('typing', 0);
    await wait(2.5);
    if (!reduced && actions.cheer) await greet();
    const seated = ['seatedIdle', 'sittingIdle', 'yell', 'fist', 'cheer'].filter(n => actions[n]);
    for (;;) {
      play('typing');
      await wait(10 + Math.random() * 6);
      const r = Math.random();
      if (!reduced && r < 0.2 && actions.sitToStand && actions.standToSit) await standBreak();
      else if (!reduced && r < 0.35 && actions.cheer) await greet();
      else if (seated.length) await play(seated[(Math.random() * seated.length) | 0]);
    }
  }
  direct();

  return {
    update(dt) {
      mixer.update(dt);
      for (let i = 0; i < 3; i++) offset.setComponent(i, damp(offset.getComponent(i), offsetTarget.getComponent(i), 6, dt));
      man.position.copy(offset).multiplyScalar(SCALE);
      slide = damp(slide, slideT, 3, dt); swivel = damp(swivel, swivelT, 3, dt);
      rig.position.set(base.x, base.y, base.z + slide);
      rig.rotation.y = Math.PI + swivel;
      if (chair) { chair.position.z = chairBase.z + slide; chair.rotation.y = chairBase.ry + swivel; }
    },
  };
}
