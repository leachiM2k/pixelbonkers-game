const D = Math.PI / 180;

export const POSE_ORDER = [
  'idle_0', 'idle_1',
  'walk_0', 'walk_1', 'walk_2', 'walk_3',
  'run_0', 'run_1', 'run_2', 'run_3',
  'jump_0', 'jump_1',
  'fall_0',
  'duck_0',
  'attack_0', 'attack_1', 'attack_2', 'attack_3',
  'throw_0', 'throw_1', 'throw_2',
  'hit_0', 'hit_1',
  'ko_0', 'ko_1', 'ko_2',
  'victory_0', 'victory_1',
];

const BASE = {
  root: { x: 0, y: 0, z: 0, turn: 0, tiltBack: 0, sideTilt: 0 },
  chest: { lean: 2, side: 0, twist: 0 },
  head: { nod: 0, turn: 0, tilt: 0 },
  shR: { swing: 4, lift: 5, twist: 0 },
  elR: { bend: 12 },
  shL: { swing: -4, lift: 5, twist: 0 },
  elL: { bend: 12 },
  hipR: { swing: 0, lift: 0, twist: 0 },
  kneeR: { bend: 4 },
  ankR: { dorsi: -3 },
  hipL: { swing: 0, lift: 0, twist: 0 },
  kneeL: { bend: 4 },
  ankL: { dorsi: -3 },
};

export const POSES = {
  idle_0: {},

  idle_1: {
    chest: { lean: 4 },
    head: { nod: 2 },
    shR: { swing: 8 }, elR: { bend: 16 },
    shL: { swing: -10 }, elL: { bend: 16 },
    hipR: { lift: 2 }, kneeR: { bend: 8 }, kneeL: { bend: 8 },
    root: { y: -0.008 },
  },

  walk_0: {
    chest: { lean: 4, twist: 6 },
    hipR: { swing: 24 }, kneeR: { bend: 12 }, ankR: { dorsi: 6 },
    hipL: { swing: -18 }, kneeL: { bend: 32 }, ankL: { dorsi: -8 },
    shR: { swing: -22 }, elR: { bend: 18 },
    shL: { swing: 22 }, elL: { bend: 24 },
  },
  walk_1: {
    chest: { lean: 3, twist: 3 },
    hipR: { swing: 8 }, kneeR: { bend: 24 },
    hipL: { swing: -4 }, kneeL: { bend: 6 },
    shR: { swing: -8 }, elR: { bend: 14 },
    shL: { swing: 8 }, elL: { bend: 18 },
  },
  walk_2: {
    chest: { lean: 4, twist: -6 },
    hipR: { swing: -18 }, kneeR: { bend: 32 }, ankR: { dorsi: -8 },
    hipL: { swing: 24 }, kneeL: { bend: 12 }, ankL: { dorsi: 6 },
    shR: { swing: 22 }, elR: { bend: 24 },
    shL: { swing: -22 }, elL: { bend: 18 },
  },
  walk_3: {
    chest: { lean: 3, twist: -3 },
    hipR: { swing: -4 }, kneeR: { bend: 6 },
    hipL: { swing: 8 }, kneeL: { bend: 24 },
    shR: { swing: 8 }, elR: { bend: 18 },
    shL: { swing: -8 }, elL: { bend: 14 },
  },

  run_0: {
    chest: { lean: 14, twist: 8 },
    hipR: { swing: 42 }, kneeR: { bend: 20 }, ankR: { dorsi: 10 },
    hipL: { swing: -28 }, kneeL: { bend: 78 }, ankL: { dorsi: -12 },
    shR: { swing: -50 }, elR: { bend: 78 },
    shL: { swing: 45 }, elL: { bend: 82 },
    root: { y: 0.005 },
  },
  run_1: {
    chest: { lean: 12, twist: 4 },
    hipR: { swing: 18 }, kneeR: { bend: 55 },
    hipL: { swing: -6 }, kneeL: { bend: 30 },
    shR: { swing: -20 }, elR: { bend: 70 },
    shL: { swing: 18 }, elL: { bend: 75 },
    root: { y: 0.03 },
  },
  run_2: {
    chest: { lean: 14, twist: -8 },
    hipR: { swing: -28 }, kneeR: { bend: 78 }, ankR: { dorsi: -12 },
    hipL: { swing: 42 }, kneeL: { bend: 20 }, ankL: { dorsi: 10 },
    shR: { swing: 45 }, elR: { bend: 82 },
    shL: { swing: -50 }, elL: { bend: 78 },
    root: { y: 0.045 },
  },
  run_3: {
    chest: { lean: 12, twist: -4 },
    hipR: { swing: -6 }, kneeR: { bend: 30 },
    hipL: { swing: 18 }, kneeL: { bend: 55 },
    shR: { swing: 18 }, elR: { bend: 75 },
    shL: { swing: -20 }, elL: { bend: 70 },
    root: { y: 0.03 },
  },

  jump_0: {
    root: { y: -0.16 },
    hipR: { swing: 38 }, kneeR: { bend: 85 }, ankR: { dorsi: 14 },
    hipL: { swing: 34 }, kneeL: { bend: 88 }, ankL: { dorsi: 14 },
    chest: { lean: 24 },
    head: { nod: -6 },
    shR: { swing: -35 }, elR: { bend: 30 },
    shL: { swing: -30 }, elL: { bend: 35 },
  },
  jump_1: {
    root: { y: 0.42 },
    hipR: { swing: 22 }, kneeR: { bend: 52 },
    hipL: { swing: 30 }, kneeL: { bend: 42 },
    chest: { lean: -4 },
    head: { nod: -8 },
    shR: { lift: 155, swing: 15 }, elR: { bend: 12 },
    shL: { swing: -25, lift: 20 }, elL: { bend: 30 },
  },

  fall_0: {
    root: { y: 0.3 },
    chest: { lean: -10 },
    head: { nod: -14 },
    shR: { lift: 120, swing: 25 }, elR: { bend: 10 },
    shL: { lift: 95, swing: -20 }, elL: { bend: 15 },
    hipR: { swing: 28 }, kneeR: { bend: 25 },
    hipL: { swing: -22 }, kneeL: { bend: 45 },
  },

  duck_0: {
    root: { y: -0.4 },
    hipR: { swing: 62 }, kneeR: { bend: 108 }, ankR: { dorsi: 20 },
    hipL: { swing: 58 }, kneeL: { bend: 112 }, ankL: { dorsi: 20 },
    chest: { lean: 32 },
    head: { nod: -20 },
    shR: { swing: 30, lift: 8 }, elR: { bend: 85 },
    shL: { swing: 26 }, elL: { bend: 90 },
  },

  attack_0: {
    chest: { lean: 4, twist: -14 },
    head: { turn: -6 },
    shR: { swing: -38, lift: 12 }, elR: { bend: 100 },
    shL: { swing: 18, lift: 10 }, elL: { bend: 78 },
    hipR: { swing: 14 }, kneeR: { bend: 14 },
    hipL: { swing: -12 }, kneeL: { bend: 22 },
  },
  attack_1: {
    chest: { lean: 8, twist: 12 },
    head: { turn: 6 },
    shR: { swing: 92, lift: 4 }, elR: { bend: 2 },
    shL: { swing: -22, lift: 8 }, elL: { bend: 95 },
    hipR: { swing: 26 }, kneeR: { bend: 12 }, ankR: { dorsi: -10 },
    hipL: { swing: -18 }, kneeL: { bend: 26 },
  },
  attack_2: {
    chest: { lean: 10, twist: 26 },
    head: { turn: 8 },
    shL: { swing: 95, lift: 2 }, elL: { bend: 4 },
    shR: { swing: -18, lift: 10 }, elR: { bend: 92 },
    hipR: { swing: 20 }, kneeR: { bend: 14 },
    hipL: { swing: -24 }, kneeL: { bend: 20 },
  },
  attack_3: {
    chest: { lean: -6, twist: 18 },
    head: { nod: -4 },
    shR: { swing: 22, lift: 55 }, elR: { bend: 105 },
    shL: { swing: -25, lift: 12 }, elL: { bend: 88 },
    hipR: { swing: 6 }, kneeR: { bend: 30 },
    hipL: { swing: -10 }, kneeL: { bend: 34 },
  },

  throw_0: {
    chest: { lean: -10, twist: -12 },
    head: { nod: -8 },
    shR: { swing: -95, lift: 35 }, elR: { bend: 105 },
    shL: { swing: 35, lift: 8 }, elL: { bend: 20 },
    hipR: { swing: 20 }, kneeR: { bend: 10 },
    hipL: { swing: -14 }, kneeL: { bend: 24 },
  },
  throw_1: {
    chest: { lean: 20, twist: 14 },
    head: { nod: 6 },
    shR: { swing: 78, lift: 25 }, elR: { bend: 8 },
    shL: { swing: -35, lift: 10 }, elL: { bend: 30 },
    hipR: { swing: 32 }, kneeR: { bend: 8 }, ankR: { dorsi: -12 },
    hipL: { swing: -22 }, kneeL: { bend: 30 },
  },
  throw_2: {
    chest: { lean: 26, twist: 22 },
    shR: { swing: 30, lift: 15 }, elR: { bend: 25 },
    shL: { swing: -20 }, elL: { bend: 40 },
    hipR: { swing: 26 }, kneeR: { bend: 10 },
    hipL: { swing: -18 }, kneeL: { bend: 26 },
  },

  hit_0: {
    root: { x: -0.06, tiltBack: 8 },
    chest: { lean: -16 },
    head: { nod: -30 },
    shR: { swing: 30, lift: 25 }, elR: { bend: 25 },
    shL: { swing: 25, lift: 30 }, elL: { bend: 30 },
    hipR: { swing: -25 }, kneeR: { bend: 18 },
    hipL: { swing: -12 }, kneeL: { bend: 30 },
  },
  hit_1: {
    root: { x: -0.1, tiltBack: -10 },
    chest: { lean: 26 },
    head: { nod: 22 },
    shR: { swing: 45, lift: 20 }, elR: { bend: 115 },
    shL: { swing: 40, lift: 25 }, elL: { bend: 120 },
    hipR: { swing: -8 }, kneeR: { bend: 25 },
    hipL: { swing: -18 }, kneeL: { bend: 38 },
  },

  ko_0: {
    root: { x: -0.14, tiltBack: 16 },
    chest: { lean: -24 },
    head: { nod: -35, turn: 4 },
    shR: { lift: 55, swing: -15 }, elR: { bend: 20 },
    shL: { lift: 60, swing: -20 }, elL: { bend: 25 },
    hipR: { swing: -32 }, kneeR: { bend: 25 },
    hipL: { swing: -18 }, kneeL: { bend: 35 },
  },
  ko_1: {
    root: { y: 0.18, tiltBack: 52 },
    chest: { lean: -18 },
    head: { nod: -28 },
    shR: { lift: 115, swing: 15 }, elR: { bend: 10 },
    shL: { lift: 100, swing: -10 }, elL: { bend: 20 },
    hipR: { swing: 35 }, kneeR: { bend: 15 },
    hipL: { swing: 28 }, kneeL: { bend: 25 },
  },
  ko_2: {
    root: { y: 0.14, x: -0.25, tiltBack: 84 },
    chest: { lean: -12 },
    head: { nod: -10 },
    shR: { lift: 150, swing: 5 }, elR: { bend: 15 },
    shL: { lift: 160, swing: -8 }, elL: { bend: 20 },
    hipR: { swing: 8 }, kneeR: { bend: 12 },
    hipL: { swing: 14 }, kneeL: { bend: 18 },
  },

  victory_0: {
    chest: { lean: -8 },
    head: { nod: -12 },
    shR: { lift: 160, swing: 5 }, elR: { bend: 10 },
    shL: { lift: 155, swing: -5 }, elL: { bend: 12 },
    hipR: { swing: 6 }, kneeR: { bend: 4 },
    hipL: { swing: 28 }, kneeL: { bend: 55 }, ankL: { dorsi: 10 },
  },
  victory_1: {
    root: { y: 0.38 },
    hipR: { swing: 30 }, kneeR: { bend: 70 },
    hipL: { swing: 24 }, kneeL: { bend: 62 },
    chest: { lean: -6 },
    head: { nod: -10 },
    shR: { lift: 150, swing: 10 }, elR: { bend: 45 },
    shL: { lift: 150, swing: -10 }, elL: { bend: 45 },
  },
};

export function applyPose(joints, name) {
  const p = mergePose(name);
  const j = joints;
  const r = p.root;
  j.root.position.set(r.x, r.y, r.z);
  j.root.rotation.set(r.sideTilt * D, -r.turn * D, r.tiltBack * D);

  j.chest.rotation.set(-p.chest.side * D, -p.chest.twist * D, -p.chest.lean * D);
  j.spine.rotation.set(0, 0, -p.chest.lean * 0.4 * D);
  j.head.rotation.set(p.head.tilt * D, -p.head.turn * D, -p.head.nod * D);

  setShoulder(j.shR, p.shR, +1);
  setShoulder(j.shL, p.shL, -1);
  j.elR.rotation.set(0, 0, p.elR.bend * D);
  j.elL.rotation.set(0, 0, p.elL.bend * D);
  j.wrR.rotation.set(0, 0, 0);
  j.wrL.rotation.set(0, 0, 0);

  setHip(j.hipR, p.hipR, +1);
  setHip(j.hipL, p.hipL, -1);
  j.kneeR.rotation.set(0, 0, -p.kneeR.bend * D);
  j.kneeL.rotation.set(0, 0, -p.kneeL.bend * D);
  j.ankR.rotation.set(0, 0, p.ankR.dorsi * D);
  j.ankL.rotation.set(0, 0, p.ankL.dorsi * D);
}

function setShoulder(j, s, side) {
  j.rotation.set(-side * s.lift * D, s.twist * D, s.swing * D);
}

function setHip(j, h, side) {
  j.rotation.set(-side * h.lift * D, h.twist * D, h.swing * D);
}

function mergePose(name) {
  const delta = POSES[name] ?? {};
  const out = {};
  for (const key of Object.keys(BASE)) {
    out[key] = { ...BASE[key], ...(delta[key] ?? {}) };
  }
  return out;
}

export function aposeAngles() {
  const p = mergePose('idle_0');
  p.shR.lift = 70;
  p.shL.lift = 70;
  p.shR.swing = 0;
  p.shL.swing = 0;
  p.elR.bend = 5;
  p.elL.bend = 5;
  return p;
}
