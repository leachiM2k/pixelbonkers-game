import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildCharacter, footPointsOf } from './model.js';
import { getCharacter, CHARACTER_ORDER, CHARACTERS } from './characters.js';
import { POSE_ORDER, applyPose, aposeAngles, POSE_VIEWS } from './poses.js';

const params = new URLSearchParams(location.search);
const HEADLESS = params.has('headless');
const CHAR_NAME = params.get('char') ?? 'teen';
const { prefix: PREFIX, config: CHAR_CONFIG } = getCharacter(CHAR_NAME);
const FOOT_POINTS = footPointsOf(CHAR_CONFIG);
const RENDER_SIZE = 1024;
const OUT_SIZE = 512;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(RENDER_SIZE, RENDER_SIZE);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
const BASE_VIEW = 1.95;
const HEAD_Y = 0.9;
function aimCamera(vs = BASE_VIEW, cx = 0, cy = HEAD_Y) {
  const h = vs / 2;
  camera.left = -h;
  camera.right = h;
  camera.top = h;
  camera.bottom = -h;
  camera.position.set(cx, cy, 6);
  camera.lookAt(cx, cy, 0);
  camera.updateProjectionMatrix();
}
aimCamera();

function frameCamera(name) {
  char.root.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(char.root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const vsY = Math.max(size.y + 0.3, 2 * (bbox.max.y - HEAD_Y) + 0.15, 2 * (HEAD_Y - bbox.min.y) + 0.15);
  const az = POSE_VIEWS[name] ?? 0;
  if (az !== 0) {
    const vs = Math.max(BASE_VIEW, vsY);
    orbitCamera(az, HEAD_Y, vs);
    return { vs, cx: 0, cy: HEAD_Y, az, minX: bbox.min.x, maxX: bbox.max.x, minY: bbox.min.y, maxY: bbox.max.y };
  }
  const maxDistX = Math.max(Math.abs(bbox.min.x), Math.abs(bbox.max.x));
  const vs = Math.max(BASE_VIEW, vsY, 2 * maxDistX + 0.25);
  const cx = vs > BASE_VIEW ? center.x : 0;
  aimCamera(vs, cx);
  return { vs, cx, cy: HEAD_Y, az: 0, minX: bbox.min.x, maxX: bbox.max.x, minY: bbox.min.y, maxY: bbox.max.y };
}

const hemi = new THREE.HemisphereLight(0xd9ecff, 0x9c8668, 1.35);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff2e0, 2.6);
key.position.set(2.2, 4.0, 1.4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd6ff, 1.4);
rim.position.set(-3.2, 2.6, -2.6);
scene.add(rim);

const char = buildCharacter(CHAR_CONFIG);
scene.add(char.root);

let outlines = [];
const OUTLINE_GAP = 0.016;
const _ws = new THREE.Vector3();
function buildOutlines() {
  for (const o of outlines) o.parent?.remove(o);
  outlines = [];
  char.root.traverse((o) => {
    if (!o.isMesh || o.userData.noOutline) return;
    const ol = new THREE.Mesh(o.geometry, outlineMat);
    const bs = o.geometry.boundingSphere ?? (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere);
    o.getWorldScale(_ws);
    const r = bs.radius * Math.max(_ws.x, _ws.y, _ws.z);
    const k = r > 1e-6 ? (r + OUTLINE_GAP) / r : 1.06;
    ol.scale.copy(o.scale).multiplyScalar(k);
    ol.position.copy(o.position).addScaledVector(o.getWorldScale(new THREE.Vector3()), 0);
    ol.rotation.copy(o.rotation);
    ol.userData.isOutline = true;
    ol.visible = showOutlines;
    o.parent.add(ol);
    outlines.push(ol);
  });
}
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x101018, side: THREE.BackSide });
let showOutlines = false;
buildOutlines();

let toonMats = null;
let useToon = false;
function makeToonMaterials() {
  const steps = new Uint8Array([70, 140, 205, 255]);
  const gradient = new THREE.DataTexture(steps, 4, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const map = new Map();
  for (const m of Object.values(char.materials)) {
    if (m) map.set(m, new THREE.MeshToonMaterial({ color: m.color.clone(), gradientMap: gradient }));
  }
  return map;
}
function applyMaterialMode() {
  if (!toonMats) toonMats = makeToonMaterials();
  char.root.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline) return;
    if (useToon) o.userData.stdMat = o.material, o.material = toonMats.get(o.userData.stdMat) ?? o.material;
    else if (o.userData.stdMat) o.material = o.userData.stdMat;
  });
}

function renderToDataURL(size = OUT_SIZE) {
  renderer.render(scene, camera);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0, size, size);
  return c.toDataURL('image/png');
}

async function postSave(name, data) {
  let body = data;
  if (typeof data === 'string' && data.startsWith('data:')) {
    body = await (await fetch(data)).blob();
  }
  const res = await fetch('/save?name=' + encodeURIComponent(name), { method: 'POST', body });
  if (!res.ok) throw new Error('save failed: ' + name);
}

let flatMats = null;
function setFlatRender(on) {
  if (on && !flatMats) {
    flatMats = new Map();
    for (const m of Object.values(char.materials)) {
      if (m) flatMats.set(m, new THREE.MeshBasicMaterial({ color: m.color.clone() }));
    }
  }
  char.root.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline) return;
    if (on) {
      if (!o.userData.flatSavedMat) o.userData.flatSavedMat = o.material;
      o.material = flatMats.get(o.userData.flatSavedMat) ?? o.userData.flatSavedMat;
    } else if (o.userData.flatSavedMat) {
      o.material = o.userData.flatSavedMat;
    }
  });
  outlineVisibility(on);
  renderer.toneMapping = on ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
}

async function renderAll() {
  const shots = [];
  const meta = { standingHeightM: 0, poses: {} };
  applyPose(char.joints, 'idle_0', FOOT_POINTS);
  char.root.updateMatrixWorld(true);
  meta.standingHeightM = new THREE.Box3().setFromObject(char.root).getSize(new THREE.Vector3()).y;
  setFlatRender(true);
  for (const name of POSE_ORDER) {
    applyPose(char.joints, name, FOOT_POINTS);
    meta.poses[name] = frameCamera(name);
    const url = renderToDataURL();
    shots.push({ name, url });
    await postSave(`${PREFIX}_${name}.png`, url);
    await frame();
  }
  setFlatRender(false);
  await postSave(`${PREFIX}_meta.json`, JSON.stringify(meta));
  const sheetUrl = await buildSheet(shots);
  await postSave(`${PREFIX}_preview_sheet.png`, sheetUrl);
  const glb = await exportGLB();
  await postSave(`${PREFIX}.glb`, glb);
  return shots.length;
}

function buildSheet(shots) {
  const cols = 7, rows = 4, cell = 256;
  const c = document.createElement('canvas');
  c.width = cols * cell; c.height = rows * cell;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#23262e';
  ctx.fillRect(0, 0, c.width, c.height);
  return new Promise((resolve) => {
    let done = 0;
    for (let i = 0; i < shots.length; i++) {
      const img = new Image();
      const col = i % cols, row = Math.floor(i / cols);
      img.onload = () => {
        const pad = 6;
        const s = cell - pad * 2;
        ctx.drawImage(img, col * cell + pad, row * cell + pad, s, s);
        ctx.fillStyle = '#9aa3b5';
        ctx.font = '13px ui-monospace, monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(shots[i].name, col * cell + 8, row * cell + 6);
        if (++done === shots.length) resolve(c.toDataURL('image/png'));
      };
      img.src = shots[i].url;
    }
  });
}

function exportGLB() {
  const savedPose = null;
  const p = aposeAngles();
  const j = char.joints;
  j.root.position.set(0, 0, 0);
  j.root.rotation.set(0, 0, 0);
  j.chest.rotation.set(0, 0, 0);
  j.spine.rotation.set(0, 0, 0);
  j.head.rotation.set(0, 0, 0);
  j.shR.rotation.set(-p.shR.lift * Math.PI / 180, 0, 0);
  j.shL.rotation.set(p.shL.lift * Math.PI / 180, 0, 0);
  j.elR.rotation.set(0, 0, p.elR.bend * Math.PI / 180);
  j.elL.rotation.set(0, 0, p.elL.bend * Math.PI / 180);
  j.hipR.rotation.set(0, 0, 0);
  j.hipL.rotation.set(0, 0, 0);
  j.kneeR.rotation.set(0, 0, -4 * Math.PI / 180);
  j.kneeL.rotation.set(0, 0, -4 * Math.PI / 180);
  j.ankR.rotation.set(0, 0, -3 * Math.PI / 180);
  j.ankL.rotation.set(0, 0, -3 * Math.PI / 180);
  const wasOutlines = outlineVisibility(false);
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(char.root, (buf) => {
      outlineVisibility(wasOutlines);
      resolve(new Blob([buf]));
    }, (err) => reject(err), { binary: true });
  });
}

function outlineVisibility(v) {
  const old = showOutlines;
  showOutlines = v;
  for (const o of outlines) o.visible = v;
  return old;
}

function frame() {
  return new Promise((r) => requestAnimationFrame(r));
}

async function debugSheet(names, azimuths = [6, 30, 60]) {
  const cell = 224;
  const c = document.createElement('canvas');
  c.width = azimuths.length * cell;
  c.height = names.length * cell;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#23262e';
  ctx.fillRect(0, 0, c.width, c.height);
  let col = 0, row = 0;
  for (const name of names) {
    for (const az of azimuths) {
      applyPose(char.joints, name, FOOT_POINTS);
      frameCamera();
      orbitCamera(az, 0.9, 1.95);
      renderer.render(scene, camera);
      const tmp = document.createElement('canvas');
      tmp.width = cell; tmp.height = cell;
      tmp.getContext('2d').drawImage(renderer.domElement, 0, 0, cell, cell);
      ctx.drawImage(tmp, col * cell, row * cell);
      col++;
    }
    ctx.fillStyle = '#9aa3b5';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(names[row], 8, row * cell + 6);
    row++;
    col = 0;
    await frame();
  }
  aimCamera();
  return c.toDataURL('image/png');
}

function orbitCamera(az, cy, vs) {
  const a = az * Math.PI / 180;
  const h = vs / 2;
  camera.left = -h; camera.right = h; camera.top = h; camera.bottom = -h;
  camera.position.set(6 * Math.sin(a), cy, 6 * Math.cos(a));
  camera.lookAt(0, cy, 0);
  camera.updateProjectionMatrix();
}

let controls = null;
let turntable = false;
function initInteractive() {
  document.body.classList.add('interactive');
  const fit = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  fit();
  window.addEventListener('resize', fit);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  const ui = document.getElementById('ui');

  const groups = [
    ['Stehen', ['idle_0', 'idle_1']],
    ['Gehen', ['walk_0', 'walk_1', 'walk_2', 'walk_3']],
    ['Rennen', ['run_0', 'run_1', 'run_2', 'run_3']],
    ['Springen', ['jump_0', 'jump_1']],
    ['Fallen', ['fall_0']],
    ['Ducken', ['duck_0']],
    ['Attacke', ['attack_0', 'attack_1', 'attack_2', 'attack_3']],
    ['Werfen', ['throw_0', 'throw_1', 'throw_2']],
    ['Getroffen', ['hit_0', 'hit_1']],
    ['K.O.', ['ko_0', 'ko_1', 'ko_2']],
    ['Siegjubel', ['victory_0', 'victory_1']],
  ];
  for (const [label, poses] of groups) {
    const sec = document.createElement('div');
    sec.className = 'group';
    const h = document.createElement('div');
    h.className = 'label';
    h.textContent = label;
    sec.appendChild(h);
    for (const p of poses) {
      const b = document.createElement('button');
      b.textContent = p;
      b.onclick = () => { applyPose(char.joints, p); frameCamera(p); };
      sec.appendChild(b);
    }
    ui.appendChild(sec);
  }

  const bar = document.getElementById('bar');
  const charSel = document.createElement('select');
  for (const c of CHARACTER_ORDER) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = CHARACTERS[c].label;
    charSel.appendChild(o);
  }
  charSel.value = CHAR_NAME;
  charSel.onchange = () => { location.search = '?char=' + charSel.value; };
  bar.appendChild(charSel);
  const mkToggle = (label, fn, initial = false) => {
    const b = document.createElement('button');
    b.textContent = label;
    let on = initial;
    const sync = () => (b.className = on ? 'on' : '');
    b.onclick = () => { on = !on; fn(on); sync(); };
    sync();
    bar.appendChild(b);
    return b;
  };
  mkToggle('Outline', (v) => outlineVisibility(v));
  mkToggle('Toon', (v) => { useToon = v; applyMaterialMode(); });
  mkToggle('Turntable', (v) => { turntable = v; });

  const btnRender = document.createElement('button');
  btnRender.textContent = 'Alle 28 Posen rendern → output/';
  btnRender.onclick = async () => {
    btnRender.disabled = true;
    btnRender.textContent = 'Rendere …';
    const n = await renderAll();
    btnRender.textContent = `${n} Posen gespeichert ✓`;
    btnRender.disabled = false;
  };
  bar.appendChild(btnRender);

  const btnGlb = document.createElement('button');
  btnGlb.textContent = 'GLB exportieren';
  btnGlb.onclick = async () => {
    const blob = await exportGLB();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teen.glb';
    a.click();
  };
  bar.appendChild(btnGlb);
}

let last = 0;
function animate(t) {
  requestAnimationFrame(animate);
  if (controls) {
    controls.update();
    if (turntable) {
      char.root.rotation.y += 0.01;
    } else {
      char.root.rotation.y = 0;
    }
  }
  renderer.render(scene, camera);
  last = t;
}

applyPose(char.joints, 'idle_0', FOOT_POINTS);
async function beautyShot() {
  applyPose(char.joints, 'idle_0', FOOT_POINTS);
  frameCamera();
  const shots = [];
  for (const [az, vs, ty] of [[45, 0.62, 1.42], [15, 0.62, 1.42], [45, 1.95, 0.9], [85, 0.62, 1.42]]) {
    orbitCamera(az, ty, vs);
    renderer.render(scene, camera);
    const c = document.createElement('canvas');
    c.width = OUT_SIZE; c.height = OUT_SIZE;
    c.getContext('2d').drawImage(renderer.domElement, 0, 0, OUT_SIZE, OUT_SIZE);
    shots.push(c.toDataURL('image/png'));
    await frame();
  }
  aimCamera();
  const cell = OUT_SIZE;
  const sheet = document.createElement('canvas');
  sheet.width = cell * 4; sheet.height = cell;
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#23262e';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  for (let i = 0; i < 4; i++) {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = shots[i]; });
    ctx.drawImage(img, i * cell, 0);
  }
  return sheet.toDataURL('image/png');
}

if (HEADLESS) {
  window.__ready = true;
  window.__renderAll = renderAll;
  window.__debugSheet = debugSheet;
  window.__beautyShot = beautyShot;
  window.__applyPosePublic = (name) => applyPose(char.joints, name, FOOT_POINTS);
  window.__orbitPublic = (az, cy, vs) => orbitCamera(az, cy, vs);
  window.__renderPublic = () => renderer.render(scene, camera);
} else {
  initInteractive();
  requestAnimationFrame(animate);
}
