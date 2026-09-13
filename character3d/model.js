import * as THREE from 'three';

const RED = 0xd13a2e, RED_D = 0x9c251b;
const GREEN = 0x3f9d3a, GREEN_D = 0x2c732a;
const OBLUE = 0x2b57c9, OBLUE_D = 0x1f4096;
const NAVY = 0x1e2f5c, NAVY_D = 0x152342;
const BROWN = 0x6b4226, BROWN_D = 0x50311b;

export const TEEN_CONFIG = {
  standPx: 92,
  colors: {
    skin: 0xeeb98f, hair: 0x3a2a1c,
    shirt: 0x2e6fd8, shirtDark: 0x24549f,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: 0x3faa4d, shoeDark: 0x2e8039, sole: 0xe9e9e9,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
  build: {
    hipsY: 0.86,
    pelvisR: 0.105,
    torsoR: 0.115, torsoLen: 0.16, torsoSX: 0.92, torsoSZ: 1.22,
    chestLift: 0.30, neckR: 0.032,
    headR: 0.1, headSX: 0.94, headSY: 1.1, headSZ: 0.96,
    shoulderW: 0.163, armR: 0.033, upperArmLen: 0.19,
    foreR: 0.027, foreLen: 0.175, handR: 0.042,
    hipW: 0.084, thighR: 0.052, thighLen: 0.27,
    shinR: 0.039, shinLen: 0.26,
    noseR: 0.015, earR: 0.018, eyeR: 0.02, eyeSide: 0.033, browY: 0.043,
    footToeX: 0.163, footHeelX: -0.096, footSoleY: -0.084, footW: 0.088,
  },
  features: { hairStyle: 'fringe', cap: null, sailorCap: null, mustache: null, overalls: null, chin: false, boots: false },
};

export const BRUNO_CONFIG = {
  standPx: 82,
  colors: {
    skin: 0xf0bb90, hair: 0x2b1d12,
    shirt: RED, shirtDark: RED_D,
    jeans: OBLUE, jeansCuff: OBLUE_D,
    shoe: BROWN, shoeDark: BROWN_D, sole: 0xd9c9a8,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
  build: {
    hipsY: 0.60,
    pelvisR: 0.12,
    torsoR: 0.125, torsoLen: 0.13, torsoSX: 1.0, torsoSZ: 1.28,
    chestLift: 0.26, neckR: 0.034,
    headR: 0.118, headSX: 0.98, headSY: 1.02, headSZ: 0.98,
    shoulderW: 0.15, armR: 0.036, upperArmLen: 0.16,
    foreR: 0.031, foreLen: 0.15, handR: 0.046,
    hipW: 0.088, thighR: 0.06, thighLen: 0.16,
    shinR: 0.045, shinLen: 0.135,
    noseR: 0.03, earR: 0.017, eyeR: 0.019, eyeSide: 0.036, browY: 0.04,
    footToeX: 0.148, footHeelX: -0.09, footSoleY: -0.084, footW: 0.092,
  },
  features: {
    hairStyle: 'capTuft',
    cap: { color: RED, dark: RED_D },
    mustache: { color: 0x2b1d12 },
    overalls: { button: 0xf2c230 },
    chin: false, boots: true, sailorCap: null,
  },
};

export const LINO_CONFIG = {
  standPx: 94,
  colors: {
    skin: 0xf0bb90, hair: 0x2b1d12,
    shirt: GREEN, shirtDark: GREEN_D,
    jeans: 0x27356e, jeansCuff: 0x354687,
    shoe: BROWN, shoeDark: BROWN_D, sole: 0xd9c9a8,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
  build: {
    hipsY: 0.80,
    pelvisR: 0.10,
    torsoR: 0.105, torsoLen: 0.17, torsoSX: 0.88, torsoSZ: 1.15,
    chestLift: 0.32, neckR: 0.03,
    headR: 0.094, headSX: 0.88, headSY: 1.18, headSZ: 0.92,
    shoulderW: 0.15, armR: 0.031, upperArmLen: 0.20,
    foreR: 0.025, foreLen: 0.19, handR: 0.04,
    hipW: 0.08, thighR: 0.048, thighLen: 0.24,
    shinR: 0.035, shinLen: 0.225,
    noseR: 0.02, earR: 0.016, eyeR: 0.018, eyeSide: 0.031, browY: 0.045,
    footToeX: 0.158, footHeelX: -0.092, footSoleY: -0.084, footW: 0.082,
  },
  features: {
    hairStyle: 'capTuft',
    cap: { color: GREEN, dark: GREEN_D },
    mustache: { color: 0x2b1d12 },
    overalls: { button: 0xf2c230 },
    chin: false, boots: true, sailorCap: null,
  },
};

export const POLDI_CONFIG = {
  standPx: 86,
  colors: {
    skin: 0xe9b184, hair: 0x241a10,
    shirt: NAVY, shirtDark: NAVY_D,
    jeans: 0x4a6ea8, jeansCuff: 0x5d82bd,
    shoe: BROWN, shoeDark: BROWN_D, sole: 0xd9c9a8,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
  build: {
    hipsY: 0.66,
    pelvisR: 0.112,
    torsoR: 0.118, torsoLen: 0.15, torsoSX: 0.98, torsoSZ: 1.2,
    chestLift: 0.28, neckR: 0.034,
    headR: 0.108, headSX: 0.96, headSY: 1.0, headSZ: 0.96,
    shoulderW: 0.158, armR: 0.026, upperArmLen: 0.15,
    foreR: 0.052, foreLen: 0.15, handR: 0.052,
    hipW: 0.084, thighR: 0.055, thighLen: 0.17,
    shinR: 0.042, shinLen: 0.16,
    noseR: 0.026, earR: 0.017, eyeR: 0.016, eyeSide: 0.034, browY: 0.036,
    footToeX: 0.155, footHeelX: -0.098, footSoleY: -0.084, footW: 0.09,
  },
  features: {
    hairStyle: 'baldSide',
    sailorCap: { color: 0xf2f2ee, band: NAVY },
    mustache: null, overalls: null,
    chin: true, boots: true, cap: null,
  },
};

// ---- PIXEL BONKERS Klassen-Figuren (Chibi-Proportionen wie die Boys, P1 dunkelblau/rot, P2 hellblau/grün) ----

const SPD_BASE = {
  standPx: 92,
  build: {
    hipsY: 0.62,
    pelvisR: 0.108,
    torsoR: 0.118, torsoLen: 0.125, torsoSX: 0.9, torsoSZ: 1.2,
    chestLift: 0.26, neckR: 0.032,
    headR: 0.19, headSX: 1.02, headSY: 0.98, headSZ: 1.0,
    shoulderW: 0.148, armR: 0.032, upperArmLen: 0.145,
    foreR: 0.026, foreLen: 0.135, handR: 0.044,
    hipW: 0.082, thighR: 0.05, thighLen: 0.13,
    shinR: 0.037, shinLen: 0.12,
    noseR: 0.026, earR: 0.02, eyeR: 0.036, eyeSide: 0.046, browY: 0.044, eyeWX: 0.82, pupilK: 0.68, browT: 0.016, browH: 0.012, browL: 0.05, mouthT: 0.014, mouthH: 0.022, mouthW: 0.06,
    footToeX: 0.17, footHeelX: -0.098, footSoleY: -0.084, footW: 0.092,
  },
  features: { hairStyle: 'fringe', headband: { color: RED, dark: RED_D }, cap: null, sailorCap: null, mustache: null, overalls: null, chin: false, boots: false },
};

export const SPD1_CONFIG = {
  ...SPD_BASE,
  colors: {
    skin: 0xeeb98f, hair: 0x2f2014,
    shirt: 0x2b62c8, shirtDark: 0x1f4a9e,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: RED, shoeDark: RED_D, sole: 0xe9e9e9,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
};

export const SPD2_CONFIG = {
  ...SPD_BASE,
  colors: {
    skin: 0xf0bb90, hair: 0x51341e,
    shirt: 0x58b4ec, shirtDark: 0x3f95c8,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: GREEN, shoeDark: GREEN_D, sole: 0xe9e9e9,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
};

const TNK_BASE = {
  standPx: 84,
  build: {
    hipsY: 0.54,
    pelvisR: 0.138,
    torsoR: 0.142, torsoLen: 0.12, torsoSX: 1.18, torsoSZ: 1.32,
    chestLift: 0.23, neckR: 0.04,
    headR: 0.145, headSX: 1.0, headSY: 1.0, headSZ: 1.0,
    shoulderW: 0.185, armR: 0.05, upperArmLen: 0.13,
    foreR: 0.048, foreLen: 0.12, handR: 0.055,
    hipW: 0.096, thighR: 0.064, thighLen: 0.125,
    shinR: 0.054, shinLen: 0.115,
    noseR: 0.034, earR: 0.02, eyeR: 0.032, eyeSide: 0.05, browY: 0.038, eyeWX: 0.82, pupilK: 0.68, browT: 0.018, browH: 0.013, browL: 0.055, mouthT: 0.012, mouthH: 0.018, mouthW: 0.056,
    footToeX: 0.175, footHeelX: -0.1, footSoleY: -0.084, footW: 0.105,
  },
  features: { hairStyle: 'baldSide', chin: true, boots: true, headband: null, cap: null, sailorCap: null, mustache: null, overalls: null },
};

export const TNK1_CONFIG = {
  ...TNK_BASE,
  colors: {
    skin: 0xe9b184, hair: 0x241a10,
    shirt: NAVY, shirtDark: NAVY_D,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: RED, shoeDark: RED_D, sole: 0xd9c9a8,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
};

export const TNK2_CONFIG = {
  ...TNK_BASE,
  colors: {
    skin: 0xf0bb90, hair: 0x2b1d12,
    shirt: 0x5fa8d8, shirtDark: 0x4a86b8,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: GREEN, shoeDark: GREEN_D, sole: 0xd9c9a8,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
};

const JMP_BASE = {
  standPx: 96,
  build: {
    hipsY: 0.66,
    pelvisR: 0.102,
    torsoR: 0.11, torsoLen: 0.135, torsoSX: 0.88, torsoSZ: 1.16,
    chestLift: 0.27, neckR: 0.03,
    headR: 0.185, headSX: 1.0, headSY: 1.0, headSZ: 0.96,
    shoulderW: 0.14, armR: 0.029, upperArmLen: 0.155,
    foreR: 0.024, foreLen: 0.145, handR: 0.042,
    hipW: 0.078, thighR: 0.046, thighLen: 0.145,
    shinR: 0.034, shinLen: 0.135,
    noseR: 0.026, earR: 0.02, eyeR: 0.034, eyeSide: 0.045, browY: 0.046, eyeWX: 0.82, pupilK: 0.68, browT: 0.016, browH: 0.012, browL: 0.05, mouthT: 0.014, mouthH: 0.022, mouthW: 0.06,
    footToeX: 0.165, footHeelX: -0.095, footSoleY: -0.084, footW: 0.088,
  },
  features: { hairStyle: 'fringe', goggles: { band: RED, lens: 0x9fe8ff, rim: 0x1a1a26 }, headband: null, cap: null, sailorCap: null, mustache: null, overalls: null, chin: false, boots: false },
};

export const JMP1_CONFIG = {
  ...JMP_BASE,
  colors: {
    skin: 0xeeb98f, hair: 0x1e1610,
    shirt: NAVY, shirtDark: NAVY_D,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: RED, shoeDark: RED_D, sole: 0xe9e9e9,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
};

export const JMP2_CONFIG = {
  ...JMP_BASE,
  colors: {
    skin: 0xf0bb90, hair: 0x6b4a22,
    shirt: 0x58b4ec, shirtDark: 0x3f95c8,
    jeans: 0x3f567f, jeansCuff: 0x55708f,
    shoe: GREEN, shoeDark: GREEN_D, sole: 0xe9e9e9,
    eyeWhite: 0xf8f8f8, eyeDark: 0x1a1620, mouth: 0x8a4a3c,
  },
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

export function footPointsOf(cfg) {
  const b = cfg.build;
  return [
    [b.footToeX * 0.98, b.footSoleY, b.footW * 0.35],
    [b.footToeX * 0.98, b.footSoleY, -b.footW * 0.35],
    [(b.footToeX + b.footHeelX) / 2, b.footSoleY - 0.002, b.footW * 0.4],
    [(b.footToeX + b.footHeelX) / 2, b.footSoleY - 0.002, -b.footW * 0.4],
    [b.footHeelX * 0.95, b.footSoleY, b.footW * 0.3],
    [b.footHeelX * 0.95, b.footSoleY, -b.footW * 0.3],
  ];
}

export const TEEN_FOOT_POINTS = footPointsOf(TEEN_CONFIG);

export function buildCharacter(cfg = TEEN_CONFIG) {
  const C = cfg;
  const b = { ...TEEN_CONFIG.build, ...C.build };
  const F = { ...TEEN_CONFIG.features, ...C.features };
  const M = {
    skin: mat(C.colors.skin, 0.7),
    hair: mat(C.colors.hair, 0.65),
    shirt: mat(C.colors.shirt, 0.9),
    shirtDark: mat(C.colors.shirtDark, 0.9),
    jeans: mat(C.colors.jeans, 0.95),
    jeansCuff: mat(C.colors.jeansCuff, 0.95),
    shoe: mat(C.colors.shoe, 0.55),
    shoeDark: mat(C.colors.shoeDark, 0.6),
    sole: mat(C.colors.sole, 0.5),
    eyeWhite: mat(C.colors.eyeWhite, 0.35),
    eyeDark: mat(C.colors.eyeDark, 0.4),
    mouth: mat(C.colors.mouth, 0.7),
    button: mat(0xf2c230, 0.4),
    capM: F.cap ? mat(F.cap.color, 0.6) : null,
    capDark: F.cap ? mat(F.cap.dark, 0.6) : null,
    sailorM: F.sailorCap ? mat(F.sailorCap.color, 0.6) : null,
    sailorBand: F.sailorCap ? mat(F.sailorCap.band, 0.7) : null,
  };

  const elbowOffset = b.upperArmLen + 0.075;
  const wristOffset = b.foreLen + 0.063;
  const kneeDrop = b.thighLen + 0.11;
  const ankleDrop = b.shinLen + 0.118;

  const root = new THREE.Group();

  const hips = group(root, 0, b.hipsY, 0);
  hips.add(mesh(sphere(b.pelvisR, 18, 14), M.jeans, 0, 0.02, 0, { scale: [0.95, 0.72, 1.22] }));
  hips.add(mesh(new THREE.CylinderGeometry(b.pelvisR, b.pelvisR * 1.067, 0.045, 18), M.shirtDark, 0, 0.075, 0, { scale: [0.95, 1, 1.2] }));

  const spine = group(hips, 0, 0.1, 0);
  spine.add(mesh(capsule(b.torsoR, b.torsoLen), M.shirt, 0, 0.16, 0, { scale: [b.torsoSX, 1, b.torsoSZ] }));
  spine.add(mesh(new THREE.CylinderGeometry(b.torsoR * 1.026, b.torsoR * 1.113, 0.09, 18), M.shirt, 0, -0.1, 0, { scale: [b.torsoSX + 0.02, 1, b.torsoSZ - 0.02] }));
  spine.add(mesh(new THREE.TorusGeometry(b.neckR * 1.47, 0.013, 10, 18), M.shirtDark, 0, b.chestLift + 0.045, 0, { rot: [Math.PI / 2, 0, 0], scale: [1.05, 1.15, 1] }));
  if (F.overalls) addOveralls(spine, b, F, M);

  const chest = group(spine, 0, b.chestLift, 0);
  chest.add(mesh(capsule(b.neckR, 0.05), M.skin, 0, 0.05, 0));

  const head = group(chest, 0, 0.1, 0);
  buildHead(head, b, F, M);

  const armR = buildArm(chest, M, +1, b, elbowOffset, wristOffset);
  const armL = buildArm(chest, M, -1, b, elbowOffset, wristOffset);

  const legR = buildLeg(hips, M, +1, b, kneeDrop, ankleDrop, F);
  const legL = buildLeg(hips, M, -1, b, kneeDrop, ankleDrop, F);

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const joints = {
    root, hips, spine, chest, head,
    shR: armR.shoulder, elR: armR.elbow, wrR: armR.wrist,
    shL: armL.shoulder, elL: armL.elbow, wrL: armL.wrist,
    hipR: legR.hip, kneeR: legR.knee, ankR: legR.ankle,
    hipL: legL.hip, kneeL: legL.knee, ankL: legL.ankle,
  };

  return { root, joints, materials: M, config: C, footPoints: footPointsOf(C) };
}

function buildHead(head, b, F, M) {
  const s = b.headR / 0.1;
  const cy = 0.075 * s;
  const fx = 0.079 * s;

  head.add(mesh(sphere(b.headR), M.skin, 0, cy, 0, { scale: [b.headSX, b.headSY, b.headSZ] }));
  head.add(mesh(sphere(b.earR * s), M.skin, 0.005 * s, cy, 0.094 * s, { scale: [0.55, 1, 0.8], noOutline: true }));
  head.add(mesh(sphere(b.earR * s), M.skin, 0.005 * s, cy, -0.094 * s, { scale: [0.55, 1, 0.8], noOutline: true }));

  for (const side of [1, -1]) {
    const ew = b.eyeWX ?? 0.55;
    head.add(mesh(sphere(b.eyeR * s), M.eyeWhite, fx, cy + 0.006 * s, side * b.eyeSide * s, { scale: [ew, 1, 0.92], noOutline: true }));
    head.add(mesh(sphere(b.eyeR * (b.pupilK ?? 0.44) * s), M.eyeDark, fx + 0.009 * s, cy + 0.006 * s, side * b.eyeSide * s, { scale: [0.5, 1, 1], noOutline: true }));
    head.add(mesh(box((b.browT ?? 0.012) * s, (b.browH ?? 0.0075) * s, (b.browL ?? 0.037) * s), M.hair, 0.084 * s, cy + b.browY * s, side * b.eyeSide * s, { rot: [0, side * 0.28, -side * 0.12], noOutline: true }));
  }
  const surfX = (dy) => b.headR * b.headSX * Math.sqrt(Math.max(0.01, 1 - (dy * dy) / (b.headR * b.headSY) ** 2));
  const dyN = -0.018 * s;
  const nr = b.noseR * s;
  head.add(mesh(sphere(nr), M.skin, surfX(dyN) + nr * 0.21, cy + dyN, 0, { scale: [0.7, 0.85, 0.8] }));
  const dyM = -0.056 * s;
  const mt = (b.mouthT ?? 0.007) * s;
  head.add(mesh(box(mt, (b.mouthH ?? 0.011) * s, (b.mouthW ?? 0.032) * s), M.mouth, surfX(dyM) + mt * 0.35, cy + dyM, 0, { rot: [0, 0.05, 0], noOutline: true }));

  if (F.chin) {
    head.add(mesh(sphere(0.036 * s), M.skin, (fx - 0.012) * s, cy - 0.078 * s, 0, { scale: [0.9, 0.72, 0.85] }));
  }
  if (F.mustache) {
    const mm = mat(F.mustache.color, 0.7);
    for (const side of [1, -1]) {
      head.add(mesh(sphere(0.03 * s), mm, (fx - 0.006) * s, cy - 0.043 * s, side * 0.026 * s, { scale: [1.7, 0.55, 0.7], rot: [0, side * 0.3, -side * 0.22] }));
    }
  }

  if (F.hairStyle === 'fringe') {
    head.add(mesh(sphere(b.headR * 1.06), M.hair, -0.006 * s, cy + 0.026 * s, 0, { scale: [0.99, 1.04, 0.99] }));
    head.add(mesh(sphere(b.headR * 0.7), M.hair, -0.058 * s, cy - 0.005 * s, 0, { scale: [0.62, 1.25, 1.02] }));
    const fringeZ = [-0.048, -0.016, 0.016, 0.048];
    fringeZ.forEach((z, i) => {
      head.add(mesh(sphere(0.031 * s), M.hair, (0.062 + (i === 1 ? 0.006 : 0)) * s, (cy + 0.056 - Math.abs(z) * 0.18) * s, z * s, {
        scale: [0.72, 0.42, 1.15],
        rot: [0, z * 1.6, -0.15 + i * 0.06],
      }));
    });
    for (const side of [1, -1]) {
      head.add(mesh(sphere(0.028 * s), M.hair, 0.02 * s, cy + 0.03 * s, side * 0.096 * s, { scale: [0.62, 0.9, 0.55] }));
    }
  } else if (F.hairStyle === 'capTuft') {
    head.add(mesh(sphere(b.headR * 0.7), M.hair, -0.056 * s, cy - 0.008 * s, 0, { scale: [0.62, 1.15, 1.02] }));
    for (const side of [1, -1]) {
      head.add(mesh(sphere(0.03 * s), M.hair, -0.005 * s, cy + 0.026 * s, side * 0.092 * s, { scale: [0.6, 0.85, 0.6] }));
    }
  } else if (F.hairStyle === 'baldSide') {
    for (const side of [1, -1]) {
      head.add(mesh(sphere(0.028 * s), M.hair, -0.012 * s, cy + 0.03 * s, side * 0.092 * s, { scale: [0.6, 0.8, 0.6] }));
    }
  }

  if (F.cap) {
    head.add(mesh(sphere(b.headR * 1.06), M.capM, 0, cy + b.headR * 0.32, 0, { scale: [1.0, 0.62, 1.0] }));
    head.add(mesh(sphere(0.052 * s), M.capDark, b.headR * 0.72, cy + b.headR * 0.26, 0, { scale: [1.12, 0.14, 0.92] }));
  }
  if (F.sailorCap) {
    head.add(mesh(new THREE.CylinderGeometry(b.headR * 0.98, b.headR * 1.04, 0.04 * s, 20), M.sailorM, 0, cy + b.headR * 0.98, 0));
    head.add(mesh(new THREE.CylinderGeometry(b.headR * 1.1, b.headR * 1.1, 0.012 * s, 20), M.sailorBand, 0, cy + b.headR * 0.82, 0));
    head.add(mesh(new THREE.CylinderGeometry(b.headR * 0.98, b.headR * 0.98, 0.014 * s, 20), M.sailorBand, 0, cy + b.headR * 1.02, 0));
  }
  if (F.headband) {
    const hm = mat(F.headband.color, 0.7);
    const hd = mat(F.headband.dark, 0.7);
    const by = cy + 0.026 * s;
    head.add(mesh(new THREE.CylinderGeometry(b.headR * 1.04, b.headR * 1.04, 0.026 * s, 18), hm, 0, by, 0, { scale: [1, 1, b.headSZ] }));
    head.add(mesh(sphere(0.017 * s), hd, -b.headR * 0.98, by + 0.004 * s, 0, { scale: [0.7, 1, 1] }));
    head.add(mesh(box(0.03 * s, 0.009 * s, 0.012 * s), hd, -b.headR * 1.12, by - 0.012 * s, 0.008 * s, { rot: [0.2, 0, -0.5] }));
    head.add(mesh(box(0.03 * s, 0.009 * s, 0.012 * s), hd, -b.headR * 1.12, by - 0.012 * s, -0.008 * s, { rot: [-0.2, 0, -0.5] }));
  }
  if (F.goggles) {
    const bm = mat(F.goggles.band, 0.7);
    const lm = mat(F.goggles.lens, 0.3);
    const rm = mat(F.goggles.rim, 0.6);
    const gy = cy + 0.058 * s;
    head.add(mesh(new THREE.CylinderGeometry(b.headR * 1.03, b.headR * 1.03, 0.02 * s, 18), bm, 0, gy, 0, { scale: [1, 1, b.headSZ] }));
    for (const side of [1, -1]) {
      const lens = new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.016 * s, 14);
      head.add(mesh(lens, lm, b.headR * b.headSX * 0.62, gy + 0.008 * s, side * 0.033 * s, { rot: [0, 0, Math.PI / 2 - 0.18], noOutline: true }));
      head.add(mesh(new THREE.TorusGeometry(0.03 * s, 0.008 * s, 8, 14), rm, b.headR * b.headSX * 0.6, gy + 0.008 * s, side * 0.033 * s, { rot: [0, Math.PI / 2, 0.95] }));
    }
  }
}

function addOveralls(spine, b, F, M) {
  const rx = b.torsoR * b.torsoSX;
  const rz = b.torsoR * b.torsoSZ;
  const R2 = rx + 0.01;
  const R1 = R2 - 0.018;
  const arc = 0.95;
  const k = (rz / rx) * 0.94;
  const bibHalfW = R2 * Math.sin(arc) * k;
  const y0 = -0.08;
  const y1 = b.chestLift * 0.55;
  const h = y1 - y0;

  const shape = new THREE.Shape();
  shape.absarc(0, 0, R1, -arc, arc, false);
  shape.absarc(0, 0, R2, arc, -arc, true);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 16 });
  const bib = new THREE.Mesh(geo, M.jeans);
  bib.rotation.x = -Math.PI / 2;
  bib.scale.set(1, k, 1);
  bib.position.y = y0;
  bib.castShadow = true;
  spine.add(bib);

  for (const side of [1, -1]) {
    const zOff = side * (bibHalfW - 0.03);
    spine.add(mesh(box(0.02, 0.2, 0.036), M.jeans, rx - 0.027, y1 + 0.03, zOff, { rot: [0, 0, 0.5] }));
    const zBtn = side * (bibHalfW - 0.055);
    const theta = Math.asin(Math.min(0.99, Math.abs(zBtn) / (R2 * k)));
    const xBtn = R2 * Math.cos(theta) + 0.004;
    spine.add(mesh(sphere(0.015), M.button, xBtn, y1 - 0.028, zBtn));
  }
}

function buildArm(chest, M, side, b, elbowOffset, wristOffset) {
  const z = side * b.shoulderW;
  const shoulder = group(chest, 0, 0.02, z);
  shoulder.add(mesh(sphere(b.armR * 1.7), M.shirt, 0, -0.015, side * 0.006, { scale: [0.88, 1.02, 1.02] }));
  shoulder.add(mesh(capsule(b.armR * 1.3, 0.028), M.shirt, 0, -0.058 * (elbowOffset / 0.265), 0));

  shoulder.add(mesh(capsule(b.armR, b.upperArmLen), M.skin, 0, -0.7 * elbowOffset, 0));

  const elbow = group(shoulder, 0, -elbowOffset, 0);
  elbow.add(mesh(sphere(b.armR), M.skin));
  elbow.add(mesh(capsule(b.foreR, b.foreLen), M.skin, 0, -0.48 * wristOffset, 0));

  const wrist = group(elbow, 0, -wristOffset, 0);
  const hs = b.handR / 0.042;
  wrist.add(mesh(sphere(b.handR), M.skin, 0, -0.028 * hs, 0, { scale: [1.05, 0.95, 0.82] }));
  wrist.add(mesh(capsule(0.0115 * hs, 0.026), M.skin, 0.008 * hs, -0.05 * hs, side * 0.026 * hs, { rot: [side * 0.5, 0, 0.3] }));

  return { shoulder, elbow, wrist };
}

function extruded(shape, depth, bevel = 0.004) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function shoeProfile(b, style) {
  const toe = b.footToeX;
  const heel = b.footHeelX;
  const soleY = b.footSoleY;
  const sole = new THREE.Shape();
  sole.moveTo(heel + 0.018, soleY);
  sole.lineTo(toe - 0.033, soleY);
  sole.quadraticCurveTo(toe, soleY + 0.002, toe, soleY + 0.022);
  sole.lineTo(toe, soleY + 0.034);
  sole.lineTo(heel + 0.018, soleY + 0.034);
  sole.quadraticCurveTo(heel, soleY + 0.034, heel, soleY + 0.017);
  sole.quadraticCurveTo(heel, soleY + 0.001, heel + 0.018, soleY);

  const collarTop = style === 'boot' ? 0.075 : 0.046;
  const upper = new THREE.Shape();
  upper.moveTo(heel + 0.014, soleY + 0.029);
  upper.lineTo(heel + 0.016, 0.005);
  upper.quadraticCurveTo(heel + 0.018, 0.042, heel + 0.048, collarTop);
  upper.lineTo(heel + 0.078, collarTop - 0.004);
  upper.quadraticCurveTo(heel + 0.091, 0.02, heel + 0.101, 0.008);
  upper.quadraticCurveTo((heel + toe) * 0.56, -0.006, toe - 0.058, -0.02);
  upper.quadraticCurveTo(toe - 0.013, -0.033, toe - 0.005, soleY + 0.032);
  upper.lineTo(heel + 0.014, soleY + 0.029);
  return { sole, upper };
}

function buildFoot(ankle, b, F, M) {
  const style = F.boots ? 'boot' : 'sneaker';
  const { sole, upper } = shoeProfile(b, style);
  ankle.add(mesh(extruded(sole, b.footW, 0.003), M.sole, 0, 0, 0));
  ankle.add(mesh(extruded(upper, b.footW * 0.9, 0.005), M.shoe, 0, 0, 0));
  ankle.add(mesh(sphere(0.052), M.sole, b.footToeX - 0.045, b.footSoleY + 0.034, 0, { scale: [0.95, 0.58, 0.78] }));
  ankle.add(mesh(box(0.026, 0.034, b.footW * 0.84), M.shoeDark, b.footHeelX + 0.03, 0.052, 0, { rot: [0.5, 0, 0.25] }));
  ankle.add(mesh(capsule(0.03, 0.02), M.jeans, 0, 0.045, 0, { scale: [1.1, 1, 1] }));
  if (style === 'sneaker') {
    for (let i = 0; i < 3; i++) {
      ankle.add(mesh(box(0.05, 0.008, b.footW * 0.7), M.sole, b.footHeelX + 0.102 + i * 0.03, 0.026 - i * 0.014, 0, { rot: [0, 0, -0.42], noOutline: true }));
    }
  }
}

function buildLeg(hips, M, side, b, kneeDrop, ankleDrop, features) {
  const z = side * b.hipW;
  const hip = group(hips, 0, -0.02, z);
  hip.add(mesh(capsule(b.thighR, kneeDrop - 0.11), M.jeans, 0, -0.49 * kneeDrop, 0));

  const knee = group(hip, 0, -kneeDrop, 0);
  knee.add(mesh(sphere(b.thighR * 0.923), M.jeans));
  knee.add(mesh(capsule(b.shinR, ankleDrop - 0.118, 14), M.jeans, 0, -0.37 * ankleDrop, 0, { scale: [1.04, 1, 1] }));
  knee.add(mesh(new THREE.CylinderGeometry(b.shinR * 1.05, b.shinR * 1.115, 0.05, 14), M.jeansCuff, 0, -0.85 * ankleDrop, 0, { scale: [1.06, 1, 1.02] }));

  const ankle = group(knee, 0, -ankleDrop, 0);
  buildFoot(ankle, b, features, M);

  return { hip, knee, ankle };
}
