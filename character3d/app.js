import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildCharacter } from './model.js';
import { POSE_ORDER, applyPose, aposeAngles } from './poses.js';

const params = new URLSearchParams(location.search);
const HEADLESS = params.has('headless');
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

const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 50);
function aimCamera(az = 30, el = 8, dist = 4.7, targetY = 0.85) {
  const e = el * Math.PI / 180;
  const a = az * Math.PI / 180;
  camera.position.set(
    dist * Math.cos(e) * Math.sin(a),
    targetY + dist * Math.sin(e),
    dist * Math.cos(e) * Math.cos(a)
  );
  camera.lookAt(0, targetY, 0);
}
aimCamera();

const hemi = new THREE.HemisphereLight(0xd9ecff, 0x9c8668, 1.35);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff2e0, 2.6);
key.position.set(2.6, 4.2, 3.0);
scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd6ff, 1.4);
rim.position.set(-3.2, 2.6, -2.6);
scene.add(rim);

const char = buildCharacter();
scene.add(char.root);

let outlines = [];
function buildOutlines() {
  for (const o of outlines) o.parent?.remove(o);
  outlines = [];
  char.root.traverse((o) => {
    if (!o.isMesh || o.userData.noOutline) return;
    const ol = new THREE.Mesh(o.geometry, outlineMat);
    const s = o.scale.clone().multiplyScalar(1.055);
    ol.scale.copy(s);
    ol.position.copy(o.position).addScaledVector(o.getWorldScale(new THREE.Vector3()), 0);
    ol.rotation.copy(o.rotation);
    ol.userData.isOutline = true;
    ol.visible = showOutlines;
    o.parent.add(ol);
    outlines.push(ol);
  });
}
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x241a20, side: THREE.BackSide });
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
    map.set(m, new THREE.MeshToonMaterial({ color: m.color.clone(), gradientMap: gradient }));
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

async function renderAll() {
  const shots = [];
  for (const name of POSE_ORDER) {
    applyPose(char.joints, name);
    const url = renderToDataURL();
    shots.push({ name, url });
    await postSave(`teen_${name}.png`, url);
    await frame();
  }
  const sheetUrl = await buildSheet(shots);
  await postSave('teen_preview_sheet.png', sheetUrl);
  const glb = await exportGLB();
  await postSave('teen.glb', glb);
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

let controls = null;
let turntable = false;
function initInteractive() {
  document.body.classList.add('interactive');
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
      b.onclick = () => applyPose(char.joints, p);
      sec.appendChild(b);
    }
    ui.appendChild(sec);
  }

  const bar = document.getElementById('bar');
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

applyPose(char.joints, 'idle_0');
if (HEADLESS) {
  window.__ready = true;
  window.__renderAll = renderAll;
} else {
  initInteractive();
  requestAnimationFrame(animate);
}
