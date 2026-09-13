import * as THREE from 'three';

export const COLORS = {
  skin: 0xeeb98f,
  skinShadow: 0xd9a077,
  hair: 0x3a2a1c,
  shirt: 0x2e6fd8,
  shirtDark: 0x24549f,
  jeans: 0x3f567f,
  jeansCuff: 0x55708f,
  sneaker: 0x3faa4d,
  sneakerDark: 0x2e8039,
  sole: 0xe9e9e9,
  eyeWhite: 0xf8f8f8,
  eyeDark: 0x2a1e14,
  mouth: 0xb06a55,
};

function mat(color, roughness = 0.85, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...opts });
}

function capsule(r, len, seg = 12) {
  return new THREE.CapsuleGeometry(r, Math.max(len, 0.0001), 4, seg);
}

function sphere(r, seg = 20) {
  return new THREE.SphereGeometry(r, seg, seg);
}

function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

function mesh(geo, material, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  if (opts.scale) m.scale.set(...opts.scale);
  if (opts.rot) m.rotation.set(...opts.rot);
  if (opts.noOutline) m.userData.noOutline = true;
  return m;
}

function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export function buildCharacter() {
  const M = {
    skin: mat(COLORS.skin, 0.7),
    hair: mat(COLORS.hair, 0.65),
    shirt: mat(COLORS.shirt, 0.9),
    shirtDark: mat(COLORS.shirtDark, 0.9),
    jeans: mat(COLORS.jeans, 0.95),
    jeansCuff: mat(COLORS.jeansCuff, 0.95),
    sneaker: mat(COLORS.sneaker, 0.55),
    sneakerDark: mat(COLORS.sneakerDark, 0.6),
    sole: mat(COLORS.sole, 0.5),
    eyeWhite: mat(COLORS.eyeWhite, 0.35),
    eyeDark: mat(COLORS.eyeDark, 0.4),
    mouth: mat(COLORS.mouth, 0.7),
  };

  const root = new THREE.Group();

  const hips = group(root, 0, 0.86, 0);
  hips.add(mesh(new THREE.SphereGeometry(0.105, 18, 14), M.jeans, 0, 0.02, 0, { scale: [0.95, 0.72, 1.22] }));
  hips.add(mesh(new THREE.CylinderGeometry(0.105, 0.112, 0.045, 18), M.shirtDark, 0, 0.075, 0, { scale: [0.95, 1, 1.2] }));

  const spine = group(hips, 0, 0.1, 0);
  spine.add(mesh(capsule(0.115, 0.16), M.shirt, 0, 0.16, 0, { scale: [0.92, 1, 1.22] }));
  spine.add(mesh(new THREE.CylinderGeometry(0.118, 0.128, 0.09, 18), M.shirt, 0, -0.1, 0, { scale: [0.94, 1, 1.2] }));
  spine.add(mesh(new THREE.TorusGeometry(0.047, 0.013, 10, 18), M.shirtDark, 0, 0.345, 0, { rot: [Math.PI / 2, 0, 0], scale: [1.05, 1.15, 1] }));

  const chest = group(spine, 0, 0.3, 0);
  chest.add(mesh(capsule(0.032, 0.05), M.skin, 0, 0.05, 0));

  const head = group(chest, 0, 0.1, 0);
  buildHead(head, M);

  const armR = buildArm(chest, M, +1);
  const armL = buildArm(chest, M, -1);

  const legR = buildLeg(hips, M, +1);
  const legL = buildLeg(hips, M, -1);

  const joints = {
    root, hips, spine, chest, head,
    shR: armR.shoulder, elR: armR.elbow, wrR: armR.wrist,
    shL: armL.shoulder, elL: armL.elbow, wrL: armL.wrist,
    hipR: legR.hip, kneeR: legR.knee, ankR: legR.ankle,
    hipL: legL.hip, kneeL: legL.knee, ankL: legL.ankle,
  };

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  return { root, joints, materials: M };
}

function buildHead(head, M) {
  const cy = 0.075;
  head.add(mesh(sphere(0.1), M.skin, 0, cy, 0, { scale: [0.94, 1.1, 0.96] }));

  head.add(mesh(sphere(0.018), M.skin, 0.005, cy, 0.094, { scale: [0.55, 1, 0.8], noOutline: true }));
  head.add(mesh(sphere(0.018), M.skin, 0.005, cy, -0.094, { scale: [0.55, 1, 0.8], noOutline: true }));

  for (const side of [1, -1]) {
    head.add(mesh(sphere(0.02), M.eyeWhite, 0.079, cy + 0.006, side * 0.033, { scale: [0.55, 1, 0.92], noOutline: true }));
    head.add(mesh(sphere(0.0088), M.eyeDark, 0.088, cy + 0.006, side * 0.033, { scale: [0.5, 1, 1], noOutline: true }));
    head.add(mesh(box(0.012, 0.0075, 0.037), M.hair, 0.084, cy + 0.043, side * 0.033, { rot: [0, side * 0.28, -side * 0.12], noOutline: true }));
  }
  head.add(mesh(sphere(0.015), M.skin, 0.088, cy - 0.018, 0, { scale: [0.7, 0.85, 0.8], noOutline: true }));
  head.add(mesh(box(0.007, 0.011, 0.032), M.mouth, 0.082, cy - 0.056, 0, { rot: [0, 0.05, 0], noOutline: true }));

  head.add(mesh(sphere(0.106), M.hair, -0.006, cy + 0.026, 0, { scale: [0.99, 1.04, 0.99] }));
  head.add(mesh(sphere(0.07), M.hair, -0.058, cy - 0.005, 0, { scale: [0.62, 1.25, 1.02] }));
  const fringeZ = [-0.048, -0.016, 0.016, 0.048];
  fringeZ.forEach((z, i) => {
    head.add(mesh(sphere(0.031), M.hair, 0.062 + (i === 1 ? 0.006 : 0), cy + 0.056 - Math.abs(z) * 0.18, z, {
      scale: [0.72, 0.42, 1.15],
      rot: [0, z * 1.6, -0.15 + i * 0.06],
    }));
  });
  for (const side of [1, -1]) {
    head.add(mesh(sphere(0.028), M.hair, 0.02, cy + 0.03, side * 0.096, { scale: [0.62, 0.9, 0.55] }));
  }
}

function buildArm(chest, M, side) {
  const z = side * 0.163;
  const shoulder = group(chest, 0, 0.02, z);
  shoulder.add(mesh(sphere(0.056), M.shirt, 0, -0.015, side * 0.006, { scale: [0.88, 1.02, 1.02] }));
  shoulder.add(mesh(capsule(0.043, 0.028), M.shirt, 0, -0.058, 0));

  shoulder.add(mesh(capsule(0.033, 0.19), M.skin, 0, -0.185, 0));

  const elbow = group(shoulder, 0, -0.265, 0);
  elbow.add(mesh(sphere(0.033), M.skin));
  elbow.add(mesh(capsule(0.027, 0.175), M.skin, 0, -0.115, 0));

  const wrist = group(elbow, 0, -0.238, 0);
  wrist.add(mesh(sphere(0.042), M.skin, 0, -0.028, 0, { scale: [1.05, 0.95, 0.82] }));
  wrist.add(mesh(capsule(0.0115, 0.026), M.skin, 0.008, -0.05, side * 0.026, { rot: [side * 0.5, 0, 0.3] }));

  return { shoulder, elbow, wrist };
}

function buildLeg(hips, M, side) {
  const z = side * 0.084;
  const hip = group(hips, 0, -0.02, z);
  hip.add(mesh(capsule(0.052, 0.27), M.jeans, 0, -0.185, 0));

  const knee = group(hip, 0, -0.38, 0);
  knee.add(mesh(sphere(0.048), M.jeans));
  knee.add(mesh(capsule(0.039, 0.26, 14), M.jeans, 0, -0.14, 0, { scale: [1.04, 1, 1] }));
  knee.add(mesh(new THREE.CylinderGeometry(0.041, 0.0435, 0.05, 14), M.jeansCuff, 0, -0.32, 0, { scale: [1.06, 1, 1.02] }));

  const ankle = group(knee, 0, -0.378, 0);
  ankle.add(mesh(capsule(0.036, 0.12), M.sole, 0.038, -0.062, 0, { scale: [1, 0.5, 1.18] }));
  ankle.add(mesh(sphere(0.055), M.sneaker, 0.005, -0.028, 0, { scale: [1.28, 0.82, 0.82] }));
  ankle.add(mesh(sphere(0.044), M.sneaker, 0.078, -0.052, 0, { scale: [1.0, 0.62, 0.74] }));
  ankle.add(mesh(sphere(0.024), M.sole, 0.083, -0.043, 0, { scale: [0.85, 0.5, 0.72], noOutline: true }));
  ankle.add(mesh(box(0.05, 0.014, 0.05), M.sole, 0.02, -0.008, 0, { noOutline: true }));
  ankle.add(mesh(box(0.028, 0.03, 0.052), M.sneakerDark, -0.048, -0.026, 0, { scale: [1, 1, 0.95] }));

  return { hip, knee, ankle };
}
