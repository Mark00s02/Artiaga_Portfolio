// actor.js — the rigged Mixamo character: fits him to the desk and chains the seated clips.
// Every clip is measured on load (hip and hand positions), so swapping a clip needs no number changes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { damp } from './hero3d-math.js';

// ~1.65 m tall: with his hands on the 79 cm desk this puts his hips on the 55 cm chair cushion.
const SCALE = 0.0115;
const CHAIR_FROM_HIPS = 0.04; // chair origin sits this far behind the hips (world +Z)

// character.glb = mesh + Mixamo skeleton + texture + every clip (built by assets-src/character/bundle.html).
// Downloaded and parsed once; each scene gets its own skinned copy.
let bundle = null;
export async function loadCharacterModel(url) {
  bundle ||= new GLTFLoader().loadAsync(url);
  const gltf = await bundle;
  const man = cloneSkinned(gltf.scene);
  man.animations = gltf.animations;
  man.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = false; } });
  return man;
}

const DESK_CLIPS = ['cheer', 'seatedIdle', 'sittingIdle', 'yell', 'fist', 'sitToStand', 'standToSit'];

export async function loadActor({ scene, model, chair, keyboard, reduced }) {
  const man = await loadCharacterModel(model);
  const byName = Object.fromEntries(man.animations.map(c => [c.name, c]));
  if (!byName.typing) throw new Error('character.glb has no typing clip');

  const rig = new THREE.Group();          // world placement: slide back from the desk / swivel
  rig.rotation.y = Math.PI;               // Mixamo faces +Z; the desk is at -Z
  rig.add(man); scene.add(rig);
  man.scale.setScalar(SCALE);

  const bone = suffix => { let b = null; man.traverse(o => { if (!b && o.isBone && o.name.endsWith(suffix)) b = o; }); return b; };
  const hips = bone('Hips'), hands = [bone('LeftHand'), bone('RightHand')];
  const mixer = new THREE.AnimationMixer(man);
  const local = b => man.worldToLocal(b.getWorldPosition(new THREE.Vector3()));
  // measurements use their own mixer so a clip arriving mid-animation doesn't disturb the one playing
  const sampler = new THREE.AnimationMixer(man);
  const sample = (clip, t) => {
    const a = sampler.clipAction(clip); a.reset().play(); a.time = t; sampler.update(0);
    man.updateMatrixWorld(true);
    const r = { hips: local(hips), hands: hands.map(local) };
    a.stop(); return r;
  };

  const clips = { typing: byName.typing };

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
  const offsets = {}, actions = {};
  function addClip(name, clip) {
    clips[name] = clip;
    const start = sample(clip, 0).hips;
    if (name === 'sitToStand') offsets[name] = new THREE.Vector3();
    else if (name === 'standToSit' && clips.sitToStand) offsets[name] = sample(clips.sitToStand, clips.sitToStand.duration - 0.01).hips.sub(start).setX(0);
    else offsets[name] = type0.hips.clone().sub(start).setX(0);
    const a = mixer.clipAction(clip);
    if (name !== 'typing') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    actions[name] = a;
  }
  addClip('typing', clips.typing);
  for (const n of DESK_CLIPS) if (byName[n]) addClip(n, byName[n]); // missing clips just aren't used

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
    for (;;) {
      const seated = ['seatedIdle', 'sittingIdle', 'yell', 'fist', 'cheer'].filter(n => actions[n]);
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
