import * as THREE from 'three';
import { buildCharacter } from './model.js';
import { POSE_ORDER, applyPose } from './poses.js';

const char = buildCharacter();
const j = char.joints;

const GROUNDED = new Set(['idle_0', 'idle_1', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'run_0', 'run_2', 'jump_0', 'duck_0', 'attack_0', 'attack_1', 'attack_2', 'attack_3', 'throw_0', 'throw_2', 'hit_0', 'hit_1', 'ko_0', 'victory_0']);
const AIR = new Set(['run_1', 'run_3', 'jump_1', 'fall_0', 'throw_1', 'ko_1', 'ko_2', 'victory_1']);

for (const name of POSE_ORDER) {
  applyPose(j, name);
  char.root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const rows = [];
  for (const side of ['R', 'L']) {
    j[`ank${side}`].getWorldPosition(v);
    rows.push(`ank${side} y=${v.y.toFixed(3)} (Sohle≈${(v.y - 0.08).toFixed(3)})`);
  }
  j.head.getWorldPosition(v);
  const headY = v.y.toFixed(2);
  j.hips.getWorldPosition(v);
  const hipsY = v.y.toFixed(2);
  const lowest = Math.min(...POSE_ORDER ? [j.ankR.getWorldPosition(new THREE.Vector3()).y - 0.08, j.ankL.getWorldPosition(new THREE.Vector3()).y - 0.08] : [0, 0]);
  const flag = GROUNDED.has(name) ? (lowest < -0.03 ? 'UNTER BODEN' : lowest > 0.05 ? 'SCHWEBT' : 'ok') : AIR.has(name) ? 'Luftpose' : '?';
  console.log(`${name.padEnd(10)} Hüfte=${hipsY} Kopf=${headY} ${rows.join(' ')} -> ${flag}`);
}
