// hero3d.js — 3D dev room behind the home hero. Self-starting ES module.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { cameraPose, scrollProgress, damp } from './hero3d-math.js';
import { createCharacter } from './character.js';
import { loadActor } from './actor.js';

// Swap these paths to change art style (realistic <-> cartoon); no other code changes needed.
const A = 'assets/3d/';
const M = id => `${A}models/${id}/${id}.gltf`;
const ASSETS = {
  hdri: `${A}hdri/lythwood_room_1k.hdr`,
  floor: { dir: `${A}textures/laminate_floor_02/`, repeat: 4 },
  wall: { dir: `${A}textures/painted_plaster_wall/`, repeat: 3 },
  desk: M('metal_office_desk'),
  chair: M('modern_arm_chair_01'),
  lamp: M('desk_lamp_arm_01'),
  plants: [M('potted_plant_01'), M('potted_plant_04')],
  books: M('book_encyclopedia_set_01'),
  notepads: M('office_notepads'),
  stationery: M('stationery_supplies'),
  shelf: M('Shelf_01'),
  sideTable: M('WoodenTable_02'),
  character: {
    texture: `${A}character/character.png`,
    clips: { // seated set only; Typing is required, the rest are optional
      typing: `${A}character/typing.fbx`,
      seatedIdle: `${A}character/seated-idle.fbx`,
      sittingIdle: `${A}character/sitting-idle.fbx`,
      yell: `${A}character/sitting-yell.fbx`,
      fist: `${A}character/banging-fist.fbx`,
      cheer: `${A}character/cheering.fbx`,
      sitToStand: `${A}character/sit-to-stand.fbx`,
      standToSit: `${A}character/stand-to-sit.fbx`,
    },
  },
};

const DESK_TOP = 0.79;
const DESK_Z = -0.7;
const CHAIR_Z = DESK_Z + 0.72;

const canvas = document.getElementById('hero3d');
const stage = document.getElementById('hero3dStage');
const hero = document.getElementById('heroSection');
if (canvas && stage && hero && !canvas.dataset.started) {
  canvas.dataset.started = '1';
  try { start(); } catch (e) { console.info('3D hero disabled:', e.message); }
}

function start() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d14');
  scene.fog = new THREE.Fog('#0b0d14', 6, 14);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 50);
  const camPos = new THREE.Vector3(...cameraPose(0, 0, 0, reduced).pos);
  const camTarget = new THREE.Vector3(...cameraPose(0, 0, 0, reduced).target);

  const gltf = new GLTFLoader();
  const loadGltf = url => gltf.loadAsync(url).then(g => {
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    return g.scene;
  });
  const place = (obj, [x, y, z], ry = 0, s = 1) => {
    obj.position.set(x, y, z); obj.rotation.y = ry; obj.scale.setScalar(s); scene.add(obj); return obj;
  };

  // ---- lighting ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envReady = new RGBELoader().loadAsync(ASSETS.hdri).then(t => {
    scene.environment = pmrem.fromEquirectangular(t).texture;
    scene.environmentIntensity = 0.12;
    t.dispose();
  });
  scene.add(new THREE.HemisphereLight('#8aa4ff', '#2a1d14', 0.15));
  const lampLight = new THREE.SpotLight('#ffb766', 14, 7, Math.PI / 3.2, 0.7, 1.4);
  lampLight.position.set(0.75, DESK_TOP + 0.75, DESK_Z + 0.05);
  lampLight.target.position.set(0.2, DESK_TOP, DESK_Z + 0.25);
  lampLight.castShadow = !coarse;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0005;
  scene.add(lampLight, lampLight.target);
  const screenGlow = new THREE.PointLight('#5b8cff', 3, 3.5, 1.4);
  screenGlow.position.set(0, DESK_TOP + 0.35, DESK_Z - 0.05);
  scene.add(screenGlow);
  const rim = new THREE.DirectionalLight('#7d9bff', 0.6);
  rim.position.set(-3, 3, -1);
  scene.add(rim);

  // ---- room shell ----
  const texLoader = new THREE.TextureLoader();
  const pbr = ({ dir, repeat }, w, h) => {
    const load = (f, srgb) => {
      const t = texLoader.load(dir + f);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat * w / 6, repeat * h / 6);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return new THREE.MeshStandardMaterial({ map: load('diff.jpg', true), normalMap: load('nor.jpg'), roughnessMap: load('rough.jpg') });
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), pbr(ASSETS.floor, 8, 8));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const wallMat = pbr(ASSETS.wall, 8, 3.2);
  wallMat.color.set('#6d6560');
  const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallMat);
  back.position.set(0, 1.6, -1.4); back.receiveShadow = true;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallMat);
  left.position.set(-2.4, 1.6, 2.6); left.rotation.y = Math.PI / 2; left.receiveShadow = true;
  scene.add(floor, back, left);

  // ---- monitors + keyboard (built in code) ----
  const code = makeCodeScreen();
  const bezel = new THREE.MeshStandardMaterial({ color: '#111216', roughness: 0.45, metalness: 0.3 });
  const screenMat = new THREE.MeshBasicMaterial({ map: code.texture, toneMapped: false });
  const monitor = (x, ry) => {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.025), bezel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.63, 0.37), screenMat);
    screen.position.z = 0.0131;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.03), bezel);
    neck.position.set(0, -0.26, -0.03);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.16), bezel);
    foot.position.set(0, -0.355, -0.01);
    g.add(frame, screen, neck, foot);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return place(g, [x, DESK_TOP + 0.36, DESK_Z - 0.2], ry);
  };
  monitor(-0.34, 0.18);
  monitor(0.34, -0.18);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.14), bezel);
  kb.position.set(0, DESK_TOP + 0.01, DESK_Z + 0.2); kb.castShadow = kb.receiveShadow = true;
  const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.04, 4, 8), bezel);
  mouse.rotation.x = Math.PI / 2; mouse.scale.y = 0.6;
  mouse.position.set(0.33, DESK_TOP + 0.015, DESK_Z + 0.22);
  scene.add(kb, mouse);

  // ---- props ----
  const deskReady = loadGltf(ASSETS.desk).then(o => place(o, [0, 0, DESK_Z]));
  const chairReady = loadGltf(ASSETS.chair).then(o => place(o, [0, 0, CHAIR_Z], Math.PI));
  const props = [
    chairReady,
    loadGltf(ASSETS.lamp).then(o => place(o, [0.82, DESK_TOP + 0.09, DESK_Z - 0.15], -2.2)),
    loadGltf(ASSETS.plants[0]).then(o => place(o, [-1.65, 0, -0.95])),
    loadGltf(ASSETS.plants[1]).then(o => place(o, [-0.82, DESK_TOP, DESK_Z - 0.2], 0.4)),
    loadGltf(ASSETS.shelf).then(o => place(o, [1.75, 0, -1.4])),
    loadGltf(ASSETS.books).then(o => place(o, [1.5, 1.02, -1.3])),
    loadGltf(ASSETS.stationery).then(o => place(o, [-0.62, DESK_TOP + 0.07, DESK_Z + 0.15], 0.5)),
    loadGltf(ASSETS.sideTable).then(o => place(o, [-1.3, 0, 0.3])),
  ];
  Promise.allSettled([deskReady, ...props]).then(rs =>
    rs.filter(r => r.status === 'rejected').forEach(r => console.info('3D prop skipped:', r.reason?.message || r.reason)));

  // ---- character (optional) ----
  let character = null;
  // the rigged Mixamo character if its files are present, otherwise the built-in procedural one
  chairReady.catch(() => null).then(async chair => {
    try {
      character = await loadActor({ scene, files: ASSETS.character.clips, texture: ASSETS.character.texture, chair, keyboard: kb.position, reduced });
    } catch (e) {
      console.info('Mixamo character not loaded, using built-in one:', e?.message || e);
      character = createCharacter({ scene, chair, seat: [0, 0.5, CHAIR_Z - 0.02], keyboard: kb.position, mouse: mouse.position, camera, reduced });
    }
  });

  // ---- input ----
  let mx = 0, my = 0;
  if (!coarse) addEventListener('pointermove', e => {
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  // ---- size ----
  let portrait = false;
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 52 : 38;
    portrait = w / h < 0.8;
    if (!portrait) camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- loop (paused when hero hidden / tab hidden) ----
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }).observe(hero);
  document.addEventListener('visibilitychange', tick);
  const clock = new THREE.Clock();
  let raf = 0, lastCode = 0, isReady = false;

  function tick() {
    const should = visible && !document.hidden;
    if (should && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
    if (!should) { cancelAnimationFrame(raf); raf = 0; } // cancel, so a resume can't start a second chain
  }
  function frame(now) {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    const px = coarse ? Math.sin(t * 0.3) * 0.3 : mx;
    const py = coarse ? Math.sin(t * 0.21) * 0.15 : my;
    const progress = scrollProgress(scrollY, hero.offsetHeight - innerHeight);
    if (isReady) { // hand off to the page: fade the room out over the last 15% of the dolly
      const o = Math.min(1, (1 - progress) / 0.15);
      stage.style.opacity = o; stage.style.visibility = o > 0 ? 'visible' : 'hidden';
      if (o === 0) { raf = requestAnimationFrame(frame); return; }
    }
    const pose = cameraPose(px, py, progress, reduced);
    const ease = reduced ? 0 : Math.min(1, progress * 1.6);
    stage.style.setProperty('--scrim', 1 - ease); // scrim fades as the text does
    if (portrait) { // pan right so the desk is centred; recentre on the monitor during the dolly
      const w = stage.clientWidth, h = stage.clientHeight;
      camera.setViewOffset(w, h, w * 0.45 * (1 - ease), h * 0.08 * (1 - ease), w, h);
    }
    for (let i = 0; i < 3; i++) {
      camPos.setComponent(i, damp(camPos.getComponent(i), pose.pos[i], 4, dt));
      camTarget.setComponent(i, damp(camTarget.getComponent(i), pose.target[i], 4, dt));
    }
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    if (now - lastCode > 120) { code.step(); lastCode = now; }
    character?.update(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  Promise.allSettled([envReady, deskReady]).then(() => {
    resize(); tick();
    requestAnimationFrame(() => {
      stage.classList.add('ready'); hero.classList.add('has-3d');
      setTimeout(() => { stage.style.transition = 'none'; isReady = true; }, 1300); // after the CSS fade-in
    });
  });
}

// Scrolling, syntax-coloured code drawn into a canvas texture for the monitors.
function makeCodeScreen() {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 376;
  const g = c.getContext('2d');
  const C = { k: '#c792ea', f: '#82aaff', s: '#c3e88d', n: '#f78c6c', p: '#89ddff', t: '#d6deeb', c: '#5c6773' };
  const SRC = [
    [['k', 'const '], ['t', 'world '], ['p', '= '], ['f', 'createWorld'], ['p', '({ '], ['t', 'seed'], ['p', ': '], ['n', '42'], ['p', ' });']],
    [['k', 'export async function '], ['f', 'getProjects'], ['p', '() {']],
    [['t', '  '], ['k', 'const '], ['t', 'res '], ['p', '= '], ['k', 'await '], ['f', 'fetch'], ['p', '('], ['s', "'/api/works'"], ['p', ');']],
    [['t', '  '], ['k', 'return '], ['t', 'res'], ['p', '.'], ['f', 'json'], ['p', '();']],
    [['p', '}']],
    [['c', '// game loop — fixed timestep']],
    [['k', 'while '], ['p', '('], ['t', 'running'], ['p', ') {']],
    [['t', '  acc '], ['p', '+= '], ['f', 'delta'], ['p', '();']],
    [['t', '  '], ['k', 'while '], ['p', '('], ['t', 'acc '], ['p', '>= '], ['t', 'STEP'], ['p', ') { '], ['f', 'update'], ['p', '('], ['t', 'STEP'], ['p', '); '], ['t', 'acc '], ['p', '-= '], ['t', 'STEP'], ['p', '; }']],
    [['t', '  '], ['f', 'render'], ['p', '('], ['t', 'acc '], ['p', '/ '], ['t', 'STEP'], ['p', ');']],
    [['p', '}']],
    [['k', 'public class '], ['f', 'PlayerController '], ['p', ': '], ['f', 'MonoBehaviour '], ['p', '{']],
    [['t', '  '], ['k', 'void '], ['f', 'Update'], ['p', '() => '], ['t', 'rb'], ['p', '.'], ['t', 'velocity '], ['p', '= '], ['t', 'input '], ['p', '* '], ['t', 'speed'], ['p', ';']],
    [['p', '}']],
    [['t', 'app'], ['p', '.'], ['f', 'get'], ['p', '('], ['s', "'/api/reviews'"], ['p', ', '], ['k', 'async '], ['p', '('], ['t', 'req'], ['p', ', '], ['t', 'res'], ['p', ') => {']],
    [['t', '  res'], ['p', '.'], ['f', 'json'], ['p', '('], ['k', 'await '], ['t', 'db'], ['p', '.'], ['f', 'find'], ['p', '({}));']],
    [['p', '});']],
    [['t', '']],
  ];
  const LH = 22, ROWS = Math.ceil(c.height / LH) + 1;
  let top = 0, typed = 0;
  function draw() {
    g.fillStyle = '#0d1117'; g.fillRect(0, 0, c.width, c.height);
    g.font = '15px "JetBrains Mono", Consolas, monospace';
    g.textBaseline = 'top';
    for (let r = 0; r < ROWS; r++) {
      const idx = top + r, line = SRC[idx % SRC.length], y = 10 + r * LH;
      g.fillStyle = '#3b4252'; g.fillText(String(idx + 1).padStart(3), 8, y);
      let x = 52, budget = r === ROWS - 2 ? typed : Infinity; // last visible line is "being typed"
      for (const [k, s] of line) {
        const part = s.slice(0, Math.max(0, budget)); budget -= s.length;
        g.fillStyle = C[k]; g.fillText(part, x, y); x += g.measureText(part).width;
        if (budget <= 0) { if (r === ROWS - 2) { g.fillStyle = '#d6deeb'; g.fillRect(x + 1, y, 8, 17); } break; }
      }
    }
    texture.needsUpdate = true;
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  draw();
  return {
    texture,
    step() {
      const len = SRC[(top + ROWS - 2) % SRC.length].reduce((n, [, s]) => n + s.length, 0);
      typed += 3;
      if (typed > len + 6) { typed = 0; top++; }
      draw();
    },
  };
}
