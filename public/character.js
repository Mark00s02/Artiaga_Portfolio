// character.js — procedural stylised dev (black hoodie, joggers, wavy dark hair), seated and animated.
// Faces -Z (toward the desk). His right side is +X. Arms are solved with two-bone IK every frame.
import * as THREE from 'three';
import { solveTwoBone, damp } from './hero3d-math.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = t => t * t * (3 - 2 * t);
const clamp01 = v => Math.min(1, Math.max(0, v));

export function createCharacter({ scene, chair, seat, keyboard, mouse, camera, reduced }) {
  // ---- materials ----
  const skin = new THREE.MeshPhysicalMaterial({ color: '#f0c3a0', roughness: 0.55, sheen: 0.4, sheenColor: '#ff9f8c', sheenRoughness: 0.6 });
  const lip = new THREE.MeshStandardMaterial({ color: '#b5705f', roughness: 0.6 });
  const fabric = new THREE.MeshPhysicalMaterial({ color: '#151518', roughness: 0.95, sheen: 1, sheenColor: '#4a4a55', sheenRoughness: 0.75 });
  const pants = fabric.clone(); pants.color.set('#1b1b1f');
  const shoe = new THREE.MeshStandardMaterial({ color: '#0d0d0f', roughness: 0.5 });
  const sole = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.8 });
  const hair = new THREE.MeshPhysicalMaterial({ color: '#1a1513', roughness: 0.6, sheen: 0.6, sheenColor: '#5a4a40' });
  const white = new THREE.MeshStandardMaterial({ color: '#f7f5f2', roughness: 0.3 });
  const iris = new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 0.25 });
  const black = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.2 });
  const glint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const string = new THREE.MeshStandardMaterial({ color: '#e8e6e1', roughness: 0.7 });

  const mesh = (geo, mat, parent, pos = [0, 0, 0], scale) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos); if (scale) m.scale.set(...scale);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  };
  const sphere = (r, s = 24) => new THREE.SphereGeometry(r, s, Math.round(s * 0.75));
  const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 16);

  // ---- skeleton-ish hierarchy ----
  const root = new THREE.Group(); scene.add(root);
  const spine = new THREE.Group(); root.add(spine);
  const chest = new THREE.Group(); chest.position.y = 0.3; spine.add(chest);
  const neck = new THREE.Group(); neck.position.y = 0.23; chest.add(neck);
  const head = new THREE.Group(); head.rotation.order = 'YXZ'; head.position.y = 0.05; neck.add(head);

  // torso (hoodie)
  mesh(capsule(0.16, 0.2), fabric, spine, [0, 0.14, 0], [1.08, 1, 0.78]);
  mesh(capsule(0.165, 0.12), fabric, chest, [0, 0.03, 0], [1.12, 1, 0.8]);
  mesh(new THREE.TorusGeometry(0.15, 0.035, 10, 32), fabric, spine, [0, 0.0, 0], [1.08, 0.78, 1]).rotation.x = Math.PI / 2; // hem band
  const pocket = mesh(new THREE.CapsuleGeometry(0.06, 0.12, 6, 12), fabric, spine, [0, 0.07, -0.118], [1, 0.55, 0.25]);
  pocket.rotation.z = Math.PI / 2;
  // hood bunched behind the neck
  const hood = mesh(new THREE.TorusGeometry(0.1, 0.05, 12, 28, Math.PI * 1.3), fabric, chest, [0, 0.2, 0.03]);
  hood.rotation.set(Math.PI / 2 - 0.25, 0, Math.PI * -0.15 + Math.PI);
  mesh(sphere(0.085), fabric, chest, [0, 0.22, 0.09], [1.2, 0.9, 0.8]);
  // drawstrings
  for (const x of [-0.035, 0.035]) {
    const s = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 6), string, chest, [x, 0.08, -0.128]);
    s.rotation.x = 0.12;
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), string, chest, [x, -0.005, -0.138]);
  }
  mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 16), skin, neck, [0, 0, 0]);

  // ---- head ----
  mesh(sphere(0.135, 40), skin, head, [0, 0.12, 0], [0.94, 1.04, 0.98]);
  mesh(sphere(0.07, 24), skin, head, [0, 0.055, -0.03], [1.2, 0.9, 1]); // jaw / cheeks
  for (const s of [-1, 1]) {
    mesh(sphere(0.03, 16), skin, head, [s * 0.126, 0.11, 0.0], [0.45, 1, 0.75]); // ears
  }
  mesh(sphere(0.017, 16), skin, head, [0, 0.095, -0.134], [1, 0.9, 1.1]); // nose
  const mouth = mesh(new THREE.TorusGeometry(0.02, 0.0032, 8, 16, Math.PI * 0.8), lip, head, [0, 0.058, -0.128]);
  mouth.rotation.set(0.15, 0, Math.PI + Math.PI * 0.1);
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(s * 0.048, 0.125, -0.108); head.add(eye);
    mesh(sphere(0.03, 24), white, eye, [0, 0, 0], [1, 1.08, 0.7]);
    mesh(sphere(0.019, 20), iris, eye, [0, -0.002, -0.017], [1, 1.05, 0.5]);
    mesh(sphere(0.011, 16), black, eye, [0, -0.002, -0.024], [1, 1, 0.4]);
    mesh(sphere(0.0045, 8), glint, eye, [s * -0.006 + 0.004, 0.006, -0.028]);
    eyes.push(eye);
    const brow = mesh(capsule(0.008, 0.035), hair, head, [s * 0.05, 0.168, -0.118]);
    brow.rotation.set(0.2, 0, Math.PI / 2 + s * 0.12);
  }

  // ---- hair: short back/sides cap + a voluminous wavy top swept to his right ----
  const cap = mesh(new THREE.SphereGeometry(0.142, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, head, [0, 0.122, 0.006], [0.98, 1.04, 1.03]);
  cap.rotation.x = 0.85; // tilt back: covers crown, back and nape; front edge sits at the hairline
  // [x, y, z, radius, yaw, roll] — elongated front-to-back waves on top
  const waves = [
    [-0.06, 0.235, 0.0, 0.07, 0.25, 0.25], [0.0, 0.252, -0.01, 0.075, 0.1, 0.05], [0.06, 0.24, 0.0, 0.07, -0.2, -0.25],
    [-0.03, 0.245, 0.06, 0.07, 0.1, 0.15], [0.04, 0.24, 0.065, 0.068, -0.1, -0.15],
    // fringe / quiff at the front, sweeping toward +x
    [-0.05, 0.235, -0.085, 0.055, 0.6, 0.35], [0.01, 0.25, -0.095, 0.058, 0.5, 0.15], [0.07, 0.228, -0.08, 0.05, 0.4, -0.2],
  ];
  for (const [x, y, z, r, yaw, roll] of waves) {
    const c = mesh(sphere(r, 24), hair, head, [x, y, z], [0.85, 0.5, 1.45]);
    c.rotation.set(-0.15, yaw, roll);
  }
  // side tufts above the ears
  for (const sd of [-1, 1]) mesh(sphere(0.05, 20), hair, head, [sd * 0.112, 0.19, -0.02], [0.55, 0.9, 1.3]);

  // ---- legs (static seated pose) ----
  for (const s of [-1, 1]) {
    mesh(capsule(0.078, 0.34), pants, root, [s * 0.09, -0.01, -0.2], [1, 1, 1]).rotation.x = Math.PI / 2;
    mesh(capsule(0.064, 0.32), pants, root, [s * 0.095, -0.21, -0.39]);
    mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.05, 16), pants, root, [s * 0.095, -0.38, -0.39]); // cuff
    const foot = mesh(capsule(0.05, 0.12), shoe, root, [s * 0.095, -0.43, -0.44], [1, 0.75, 1]);
    foot.rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.1, 0.018, 0.21), sole, root, [s * 0.095, -0.465, -0.44]);
  }

  // ---- arms + hands (positioned each frame, live in root space) ----
  const L1 = 0.25, L2 = 0.235;
  const upperGeo = capsule(0.056, L1), foreGeo = capsule(0.049, L2);
  const arms = [-1, 1].map(side => {
    const upper = mesh(upperGeo, fabric, root), fore = mesh(foreGeo, fabric, root);
    const elbowBall = mesh(sphere(0.052), fabric, root);
    const shoulder = new THREE.Object3D(); shoulder.position.set(side * 0.19, 0.12, 0.0); chest.add(shoulder);
    mesh(sphere(0.064), fabric, shoulder, [0, 0, 0]);
    const hand = new THREE.Group(); root.add(hand);
    mesh(new THREE.CylinderGeometry(0.05, 0.046, 0.04, 16), fabric, hand, [0, 0.012, 0]); // cuff
    mesh(sphere(0.04, 24), skin, hand, [0, -0.048, 0], [0.95, 1.05, 0.5]); // palm
    const fingers = [-1.5, -0.5, 0.5, 1.5].map((k, i) => {
      const f = new THREE.Group(); f.position.set(k * 0.0165, -0.08, 0); hand.add(f);
      mesh(capsule(0.0095, i === 0 || i === 3 ? 0.03 : 0.038), skin, f, [0, -0.022, 0]);
      return f;
    });
    const thumb = new THREE.Group(); thumb.position.set(-side * 0.036, -0.035, -0.006); hand.add(thumb);
    mesh(capsule(0.011, 0.03), skin, thumb, [0, -0.02, 0]);
    thumb.rotation.z = -side * 0.7;
    return { side, upper, fore, elbowBall, shoulder, hand, fingers, thumb, tap: [0, 0, 0, 0], target: V(0, 0, 0) };
  });

  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });

  // ---- placement ----
  const base = V(...seat);
  const chairBase = chair ? { z: chair.position.z, ry: chair.rotation.y } : null;
  const toCam = () => { const d = camera.position.clone().sub(base); return Math.atan2(-d.x, -d.z); };

  // ---- animation state ----
  let t = 0, nextKey = 0, mouseUntil = 0, mouseNext = 6, blinkAt = 2, lookMon = 0, lookNext = 3;
  let waveStart = reduced ? Infinity : 2.2, waveNext = 0;
  const WAVE = 6.2;
  const look = { yaw: 0, pitch: 0 };
  const tmp = V(0, 0, 0), up = V(0, 1, 0);

  const kbLocal = () => root.worldToLocal(keyboard.clone());
  const mouseLocal = () => root.worldToLocal(mouse.clone());

  function placeLimb(m, a, b) {
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, tmp.copy(b).sub(a).normalize());
  }
  function orientHand(h, wrist, forward, backHint) {
    const y = forward.clone().negate();
    const z = backHint.clone().sub(forward.clone().multiplyScalar(backHint.dot(forward))).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);
    h.position.copy(wrist);
    h.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }

  function update(dt) {
    t += dt;
    // ---- wave sequence: push back, swivel to the visitor, wave, swivel back ----
    if (t > waveStart + WAVE) { waveStart = t + 22 + Math.random() * 12; }
    const wt = t - waveStart;
    const turnIn = smooth(clamp01(wt / 0.9)), turnOut = smooth(clamp01((wt - (WAVE - 1.1)) / 1.1));
    const w = wt >= 0 && wt <= WAVE ? turnIn * (1 - turnOut) : 0; // 0 typing .. 1 facing camera
    const swivel = w * Math.max(-1.45, toCam() * 0.6);
    const slide = w * 0.32;

    root.position.set(base.x, base.y, base.z + slide);
    root.rotation.y = swivel;
    if (chair) { chair.position.z = chairBase.z + slide; chair.rotation.y = chairBase.ry + swivel; }

    // posture: lean in to type, sit up to wave; breathing
    spine.rotation.x = -0.22 * (1 - w) - 0.02;
    chest.scale.setScalar(1 + Math.sin(t * 1.6) * 0.008);

    // ---- head look ----
    let ty, tp;
    if (w > 0.01) {
      const camL = root.worldToLocal(camera.position.clone());
      const hp = root.worldToLocal(head.getWorldPosition(V(0, 0, 0)));
      const d = camL.sub(hp);
      ty = THREE.MathUtils.clamp(Math.atan2(-d.x, -d.z), -1.1, 1.1);
      tp = THREE.MathUtils.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.3, 0.4);
    } else {
      if (t > lookNext) { lookMon = lookMon ? 0 : 1; lookNext = t + 2.5 + Math.random() * 4; }
      ty = lookMon ? -0.22 : 0.2; tp = -0.08 + Math.sin(t * 7) * 0.01;
      if (t < mouseUntil) ty = -0.45;
    }
    look.yaw = damp(look.yaw, ty, 5, dt); look.pitch = damp(look.pitch, tp, 5, dt);
    head.rotation.y = look.yaw * 0.75; chest.rotation.y = look.yaw * 0.25 * w;
    head.rotation.x = -look.pitch;
    head.rotation.z = Math.sin(t * 0.7) * 0.03 + w * Math.sin(wt * 2.2) * 0.06; // friendly head tilt when waving

    // blink
    if (t > blinkAt + 0.14) blinkAt = t + 2.5 + Math.random() * 3;
    const blink = t > blinkAt ? Math.sin(((t - blinkAt) / 0.14) * Math.PI) : 0;
    eyes.forEach(e => (e.scale.y = 1 - blink * 0.9));
    mouth.scale.set(1 + w * 0.35, 1 + w * 0.5, 1); // bigger smile when waving

    // ---- hand targets (root space) ----
    if (t > nextKey) { // a keystroke
      nextKey = t + 0.07 + Math.random() * 0.12;
      const a = arms[Math.random() < 0.5 ? 0 : 1];
      a.tap[(Math.random() * 4) | 0] = 1;
      a.jitter = (Math.random() - 0.5) * 0.04;
    }
    if (t > mouseNext && w === 0) { mouseUntil = t + 1.8 + Math.random(); mouseNext = mouseUntil + 7 + Math.random() * 8; }
    const kb = kbLocal(), ms = mouseLocal();
    for (const a of arms) {
      const sh = root.worldToLocal(a.shoulder.getWorldPosition(V(0, 0, 0)));
      // typing pose: wrists hover just behind the keys
      const typing = V(kb.x + a.side * 0.085 + (a.jitter || 0), kb.y + 0.055 + Math.abs(Math.sin(t * 9 + a.side)) * 0.006, kb.z + 0.11);
      if (a.side > 0 && t < mouseUntil) typing.set(ms.x - 0.01, ms.y + 0.05, ms.z + 0.09);
      // wave pose: right hand up by the head, left hand resting on the lap
      const waving = a.side > 0
        ? V(0.4 + Math.sin(wt * 9) * 0.06, 0.7, -0.02)
        : V(-0.12, 0.08, -0.22);
      a.target.lerpVectors(typing, waving, w);
      const pole = a.side > 0 && w > 0.5 ? [1, -0.6, 0.6] : [a.side * 0.8, -1, 0.6];
      const { elbow, hand } = solveTwoBone(sh.toArray(), a.target.toArray(), L1, L2, pole);
      const e = V(...elbow), h = V(...hand);
      placeLimb(a.upper, sh, e); placeLimb(a.fore, e, h); a.elbowBall.position.copy(e);
      const fwd = h.clone().sub(e).normalize();
      // palm down while typing; palm toward the visitor while waving
      const back = a.side > 0 && w > 0.5 ? V(0, 0, 1).lerp(V(-0.3, 0.2, 1), 0.5) : V(0, 1, 0.2);
      if (a.side > 0 && w > 0.5) fwd.lerp(V(0.15, 1, -0.1).normalize(), w).normalize();
      else fwd.lerp(V(0, -0.35, -1).normalize(), 0.5 * (1 - w)).normalize();
      orientHand(a.hand, h, fwd, back);
      // fingers: curled over keys with taps; open and spread when waving
      const open = a.side > 0 ? w : w * 0.3;
      a.fingers.forEach((f, i) => {
        a.tap[i] = Math.max(0, a.tap[i] - dt * 9);
        f.rotation.x = (0.75 + a.tap[i] * 0.45) * (1 - open) + 0.05 * open;
        f.rotation.z = (i - 1.5) * 0.12 * open;
      });
      a.thumb.rotation.x = 0.4 * (1 - open);
    }
  }

  update(0);
  return { root, update };
}
